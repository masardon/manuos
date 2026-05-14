// Dependencies API - Create, update, and manage task dependencies
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const createDependencySchema = z.object({
  // Predecessor
  predecessorTaskId: z.string().optional(),
  predecessorJobsheetId: z.string().optional(),
  predecessorMoId: z.string().optional(),
  predecessorOrderId: z.string().optional(),
  
  // Successor
  successorTaskId: z.string().optional(),
  successorJobsheetId: z.string().optional(),
  successorMoId: z.string().optional(),
  successorOrderId: z.string().optional(),
  
  // Dependency details
  dependencyType: z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']).default('FINISH_TO_START'),
  lagDays: z.number().default(0),
  notes: z.string().optional(),
})

const batchCreateDependencySchema = z.object({
  dependencies: z.array(createDependencySchema).min(1),
})

// GET /api/dependencies - List all dependencies
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const taskId = searchParams.get('taskId')
    const jobsheetId = searchParams.get('jobsheetId')
    const moId = searchParams.get('moId')
    const orderId = searchParams.get('orderId')

    const where: any = { 
      tenantId: user.tenantId,
      isActive: true 
    }

    // Filter by any entity
    if (taskId) {
      where.OR = [
        { predecessorTaskId: taskId },
        { successorTaskId: taskId }
      ]
    }
    if (jobsheetId) {
      where.OR = [
        { predecessorJobsheetId: jobsheetId },
        { successorJobsheetId: jobsheetId }
      ]
    }
    if (moId) {
      where.OR = [
        { predecessorMoId: moId },
        { successorMoId: moId }
      ]
    }
    if (orderId) {
      where.OR = [
        { predecessorOrderId: orderId },
        { successorOrderId: orderId }
      ]
    }

    const dependencies = await db.taskDependency.findMany({
      where,
      include: {
        predecessorTask: {
          select: { id: true, taskNumber: true, name: true }
        },
        successorTask: {
          select: { id: true, taskNumber: true, name: true }
        },
        predecessorJobsheet: {
          select: { id: true, jsNumber: true, name: true }
        },
        successorJobsheet: {
          select: { id: true, jsNumber: true, name: true }
        },
        predecessorMO: {
          select: { id: true, moNumber: true, name: true }
        },
        successorMO: {
          select: { id: true, moNumber: true, name: true }
        },
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      dependencies,
      count: dependencies.length
    })
  } catch (error) {
    console.error('Error fetching dependencies:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch dependencies' }, { status: 500 })
  }
}

// POST /api/dependencies - Create single or batch dependencies
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    // Check if it's a batch request
    if (body.dependencies && Array.isArray(body.dependencies)) {
      const data = batchCreateDependencySchema.parse(body)
      const results: any[] = []
      
      for (const dep of data.dependencies) {
        // Validate that we have at least one predecessor and one successor
        const hasPredecessor = dep.predecessorTaskId || dep.predecessorJobsheetId || dep.predecessorMoId || dep.predecessorOrderId
        const hasSuccessor = dep.successorTaskId || dep.successorJobsheetId || dep.successorMoId || dep.successorOrderId
        
        if (!hasPredecessor || !hasSuccessor) {
          results.push({
            success: false,
            error: 'Each dependency must have at least one predecessor and one successor'
          })
          continue
        }
        
        // Check for existing dependency to avoid duplicates
        const existing = await db.taskDependency.findFirst({
          where: {
            tenantId: user.tenantId,
            predecessorTaskId: dep.predecessorTaskId || null,
            successorTaskId: dep.successorTaskId || null,
            predecessorJobsheetId: dep.predecessorJobsheetId || null,
            successorJobsheetId: dep.successorJobsheetId || null,
            predecessorMoId: dep.predecessorMoId || null,
            successorMoId: dep.successorMoId || null,
            predecessorOrderId: dep.predecessorOrderId || null,
            successorOrderId: dep.successorOrderId || null,
          }
        })
        
        if (existing) {
          // Update existing dependency
          const updated = await db.taskDependency.update({
            where: { id: existing.id },
            data: {
              dependencyType: dep.dependencyType as any,
              lagDays: dep.lagDays,
              notes: dep.notes,
              isActive: true,
            }
          })
          results.push({ success: true, dependency: updated, action: 'updated' })
        } else {
          // Create new dependency
          const created = await db.taskDependency.create({
            data: {
              tenantId: user.tenantId,
              predecessorTaskId: dep.predecessorTaskId,
              predecessorJobsheetId: dep.predecessorJobsheetId,
              predecessorMoId: dep.predecessorMoId,
              predecessorOrderId: dep.predecessorOrderId,
              successorTaskId: dep.successorTaskId,
              successorJobsheetId: dep.successorJobsheetId,
              successorMoId: dep.successorMoId,
              successorOrderId: dep.successorOrderId,
              dependencyType: dep.dependencyType as any,
              lagDays: dep.lagDays,
              notes: dep.notes,
            }
          })
          results.push({ success: true, dependency: created, action: 'created' })
        }
      }
      
      return NextResponse.json({
        success: true,
        results,
        message: `Processed ${results.length} dependencies`
      }, { status: 201 })
    } else {
      // Single dependency
      const data = createDependencySchema.parse(body)
      
      // Validate that we have at least one predecessor and one successor
      const hasPredecessor = data.predecessorTaskId || data.predecessorJobsheetId || data.predecessorMoId || data.predecessorOrderId
      const hasSuccessor = data.successorTaskId || data.successorJobsheetId || data.successorMoId || data.successorOrderId
      
      if (!hasPredecessor || !hasSuccessor) {
        return NextResponse.json(
          { error: 'Each dependency must have at least one predecessor and one successor' },
          { status: 400 }
        )
      }
      
      // Check for existing ACTIVE dependency
      const existing = await db.taskDependency.findFirst({
        where: {
          tenantId: user.tenantId,
          isActive: true,  // Only check active dependencies
          predecessorTaskId: data.predecessorTaskId || null,
          successorTaskId: data.successorTaskId || null,
          predecessorJobsheetId: data.predecessorJobsheetId || null,
          successorJobsheetId: data.successorJobsheetId || null,
          predecessorMoId: data.predecessorMoId || null,
          successorMoId: data.successorMoId || null,
          predecessorOrderId: data.predecessorOrderId || null,
          successorOrderId: data.successorOrderId || null,
        }
      })
      
      if (existing) {
        return NextResponse.json(
          { error: 'Dependency already exists', dependency: existing },
          { status: 409 }
        )
      }
      
      const dependency = await db.taskDependency.create({
        data: {
          tenantId: user.tenantId,
          predecessorTaskId: data.predecessorTaskId,
          predecessorJobsheetId: data.predecessorJobsheetId,
          predecessorMoId: data.predecessorMoId,
          predecessorOrderId: data.predecessorOrderId,
          successorTaskId: data.successorTaskId,
          successorJobsheetId: data.successorJobsheetId,
          successorMoId: data.successorMoId,
          successorOrderId: data.successorOrderId,
          dependencyType: data.dependencyType as any,
          lagDays: data.lagDays,
          notes: data.notes,
        }
      })
      
      return NextResponse.json({
        success: true,
        dependency,
        message: 'Dependency created successfully'
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating dependency:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create dependency' }, { status: 500 })
  }
}

// DELETE /api/dependencies - Delete dependencies
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const dependencyId = searchParams.get('id')
    const taskId = searchParams.get('taskId')
    const jobsheetId = searchParams.get('jobsheetId')
    const moId = searchParams.get('moId')
    const orderId = searchParams.get('orderId')
    const hardDelete = searchParams.get('hard') === 'true'

    if (dependencyId) {
      // Delete specific dependency
      const dependency = await db.taskDependency.findFirst({
        where: { id: dependencyId, tenantId: user.tenantId }
      })
      
      if (!dependency) {
        return NextResponse.json({ error: 'Dependency not found' }, { status: 404 })
      }
      
      if (hardDelete) {
        // Hard delete - permanently remove
        await db.taskDependency.delete({
          where: { id: dependencyId }
        })
      } else {
        // Soft delete by setting isActive to false
        await db.taskDependency.update({
          where: { id: dependencyId },
          data: { isActive: false }
        })
      }
      
      return NextResponse.json({
        success: true,
        message: hardDelete ? 'Dependency permanently deleted' : 'Dependency deleted successfully'
      })
    } else if (taskId || jobsheetId || moId || orderId) {
      // Delete all dependencies for an entity
      const where: any = { tenantId: user.tenantId, isActive: true }
      
      if (taskId) {
        where.OR = [
          { predecessorTaskId: taskId },
          { successorTaskId: taskId }
        ]
      } else if (jobsheetId) {
        where.OR = [
          { predecessorJobsheetId: jobsheetId },
          { successorJobsheetId: jobsheetId }
        ]
      } else if (moId) {
        where.OR = [
          { predecessorMoId: moId },
          { successorMoId: moId }
        ]
      } else if (orderId) {
        where.OR = [
          { predecessorOrderId: orderId },
          { successorOrderId: orderId }
        ]
      }
      
      const result = await db.taskDependency.updateMany({
        where,
        data: { isActive: false }
      })
      
      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Deleted ${result.count} dependencies`
      })
    } else {
      return NextResponse.json(
        { error: 'Must provide dependency ID or entity ID to delete' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deleting dependencies:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete dependencies' }, { status: 500 })
  }
}

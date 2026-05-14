import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/tasks/[id]/materials - Get materials allocated to a task
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const task = await db.machiningTask.findUnique({
      where: { id },
      include: {
        jobsheet: {
          include: {
            materialAllocations: {
              include: {
                materialRequirement: true
              }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Get material allocations for this jobsheet
    const jobAllocations = task.jobsheet?.materialAllocations || []
    
    // Get task-specific material allocations
    const taskAllocations = await db.taskMaterialAllocation.findMany({
      where: { taskId: id },
      include: {
        jobsheetMaterial: {
          include: {
            materialRequirement: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      jobAllocations,
      taskAllocations,
      count: jobAllocations.length + taskAllocations.length,
    })
  } catch (error) {
    console.error('Error fetching task materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task materials' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/[id]/materials - Allocate materials to a task or consume materials
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, materialId, quantity, notes } = body

    const task = await db.machiningTask.findUnique({
      where: { id },
      include: {
        jobsheet: {
          include: {
            materialAllocations: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (action === 'allocate') {
      // Allocate material from jobsheet to task
      const { jobsheetMaterialId, allocatedQty } = body
      
      const allocation = await db.taskMaterialAllocation.create({
        data: {
          tenantId: task.tenantId,
          jobsheetMaterialId,
          taskId: id,
          allocatedQty,
          consumedQty: 0,
          wastedQty: 0,
          remainingQty: allocatedQty,
          status: 'ALLOCATED',
        }
      })

      // Update jobsheet material available quantity
      await db.jobsheetMaterial.update({
        where: { id: jobsheetMaterialId },
        data: {
          availableQty: { decrement: allocatedQty }
        }
      })

      return NextResponse.json({
        success: true,
        allocation,
        message: 'Material allocated to task',
      })
    } else if (action === 'consume') {
      // Consume material for task
      const { taskMaterialAllocationId, consumedQty, wastedQty = 0 } = body
      
      const allocation = await db.taskMaterialAllocation.findUnique({
        where: { id: taskMaterialAllocationId }
      })

      if (!allocation) {
        return NextResponse.json(
          { error: 'Material allocation not found' },
          { status: 404 }
        )
      }

      // Update allocation
      const newConsumedQty = allocation.consumedQty + consumedQty
      const newWastedQty = allocation.wastedQty + wastedQty
      const newRemainingQty = allocation.allocatedQty - newConsumedQty - newWastedQty

      await db.taskMaterialAllocation.update({
        where: { id: taskMaterialAllocationId },
        data: {
          consumedQty: newConsumedQty,
          wastedQty: newWastedQty,
          remainingQty: newRemainingQty,
          status: newRemainingQty <= 0 ? 'CONSUMED' : 'PARTIALLY_CONSUMED',
          consumedAt: new Date(),
          consumedBy: body.consumedBy,
          wasteReason: wastedQty > 0 ? body.wasteReason : null,
          notes: notes || null,
        }
      })

      // Update material requirement consumed quantity
      if (allocation.jobsheetMaterialId) {
        const jobsheetMaterial = await db.jobsheetMaterial.findUnique({
          where: { id: allocation.jobsheetMaterialId },
          include: { materialRequirement: true }
        })

        if (jobsheetMaterial?.materialRequirementId) {
          await db.materialRequirement.update({
            where: { id: jobsheetMaterial.materialRequirementId },
            data: {
              consumedQty: { increment: consumedQty }
            }
          })
        }

        // Update jobsheet material consumed quantity
        await db.jobsheetMaterial.update({
          where: { id: allocation.jobsheetMaterialId },
          data: {
            consumedQty: { increment: consumedQty + wastedQty }
          }
        })
      }

      // Create inventory transaction for consumption
      if (consumedQty > 0) {
        const jobsheetMaterial = await db.jobsheetMaterial.findUnique({
          where: { id: allocation.jobsheetMaterialId },
          include: { materialRequirement: { include: { inventory: true } } }
        })

        if (jobsheetMaterial?.materialRequirement?.inventoryId) {
          await db.inventoryTransaction.create({
            data: {
              tenantId: task.tenantId,
              inventoryId: jobsheetMaterial.materialRequirement.inventoryId,
              type: 'CONSUMPTION',
              quantity: -consumedQty,
              balance: 0, // Will be calculated
              referenceType: 'TASK',
              referenceId: id,
              notes: `Consumed by task ${task.taskNumber}`,
              createdBy: body.consumedBy || 'system',
            }
          })

          // Update inventory quantity
          await db.inventory.update({
            where: { id: jobsheetMaterial.materialRequirement.inventoryId },
            data: {
              quantity: { decrement: consumedQty },
              availableQty: { decrement: consumedQty },
              consumedQty: { increment: consumedQty }
            }
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Material consumption recorded',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "allocate" or "consume"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error with task materials:', error)
    return NextResponse.json(
      { error: 'Failed to process task materials' },
      { status: 500 }
    )
  }
}
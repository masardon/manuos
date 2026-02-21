import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getTenantId, getUserId } from '@/lib/middleware/auth'
import { MachineStatus, BreakdownType } from '@prisma/client'

// GET /api/breakdowns - List all breakdowns
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request.headers)
    // For demo purposes, use YPTI tenant even without auth
    const tenantId = user?.tenantId || 'tenant_ypti'

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const breakdowns = await db.breakdown.findMany({
      where: { tenantId },
      orderBy: {
        reportedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      breakdowns,
      count: breakdowns.length,
    })
  } catch (error) {
    console.error('Error fetching breakdowns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch breakdowns' },
      { status: 500 }
    )
  }
}

// POST /api/breakdowns - Create new breakdown
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth(request)
    if (authError) return authError

    const tenantId = await getTenantId(request)
    const userId = await getUserId(request)

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.machineId || !body.type || !body.description) {
      return NextResponse.json(
        { error: 'Machine ID, type, and description are required' },
        { status: 400 }
      )
    }

    // Verify machine exists and belongs to tenant
    const machine = await db.machine.findFirst({
      where: {
        id: body.machineId,
        tenantId,
      },
    })

    if (!machine) {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      )
    }

    // Create breakdown
    const breakdown = await db.breakdown.create({
      data: {
        tenantId,
        machineId: body.machineId,
        reportedBy: userId,
        type: body.type as BreakdownType,
        description: body.description,
        notes: body.notes || null,
      },
    })

    // Update machine status to DOWN
    await db.machine.update({
      where: { id: body.machineId },
      data: { status: MachineStatus.DOWN },
    })

    // If a task is affected, update it
    if (body.affectedTaskId) {
      await db.machiningTask.update({
        where: {
          id: body.affectedTaskId,
          tenantId,
        },
        data: {
          breakdownAt: new Date(),
          breakdownNote: body.description,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: breakdown,
      message: 'Breakdown reported successfully',
    })
  } catch (error) {
    console.error('Error creating breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to report breakdown' },
      { status: 500 }
    )
  }
}

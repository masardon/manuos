import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { MachineStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const tenantId = user.tenantId
    const userId = user.id
    const { id: breakdownId } = await context.params

    // Get the breakdown
    const breakdown = await db.breakdown.findFirst({
      where: {
        id: breakdownId,
        tenantId,
      },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    })

    if (!breakdown) {
      return NextResponse.json(
        { error: 'Breakdown not found' },
        { status: 404 }
      )
    }

    if (breakdown.resolved) {
      return NextResponse.json(
        { error: 'Breakdown is already resolved' },
        { status: 400 }
      )
    }

    // Update breakdown
    const updatedBreakdown = await db.breakdown.update({
      where: { id: breakdownId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolution: 'Machine restored to service',
      },
    })

    // Update machine status back to IDLE
    if (breakdown.machine) {
      await db.machine.update({
        where: { id: breakdown.machineId },
        data: { status: MachineStatus.IDLE },
      })
    }

    // Resolve affected task if any
    if (breakdown.affectedTaskId) {
      await db.machiningTask.update({
        where: {
          id: breakdown.affectedTaskId,
          tenantId,
        },
        data: {
          resolvedAt: new Date(),
          breakdownNote: null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: updatedBreakdown,
      message: 'Breakdown resolved successfully',
    })
  } catch (error) {
    console.error('Error resolving breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to resolve breakdown' },
      { status: 500 }
    )
  }
}

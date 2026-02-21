import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getTenantId, getUserId } from '@/lib/middleware/auth'
import { MachineStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const breakdownId = params.id

    // Get the breakdown
    const breakdown = await db.breakdown.findFirst({
      where: {
        id: breakdownId,
        tenantId,
      },
      include: {
        machine: true,
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

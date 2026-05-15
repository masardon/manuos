import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MachineStatus, TaskStatus } from '@prisma/client'

const TENANT_ID = 'tenant_ypti'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: breakdownId } = await context.params
    const body = await request.json().catch(() => ({}))

    const breakdown = await db.breakdown.findFirst({
      where: { id: breakdownId, tenantId: TENANT_ID },
      include: {
        machine: { select: { id: true, name: true, code: true, status: true } },
      },
    })

    if (!breakdown) {
      return NextResponse.json({ error: 'Breakdown not found' }, { status: 404 })
    }

    if (breakdown.resolved) {
      return NextResponse.json({ error: 'Breakdown is already resolved' }, { status: 400 })
    }

    const resolution = body.resolution || 'Machine restored to service'

    // Resolve the breakdown
    const updatedBreakdown = await db.breakdown.update({
      where: { id: breakdownId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: body.resolvedBy || 'system',
        resolution,
      },
    })

    // Update machine status back to IDLE
    await db.machine.update({
      where: { id: breakdown.machineId },
      data: { status: MachineStatus.IDLE, notes: null },
    })

    // Find all tasks that were paused due to this breakdown
    const pausedTasks = await db.machiningTask.findMany({
      where: {
        tenantId: TENANT_ID,
        breakdownId: breakdownId,
        status: TaskStatus.PAUSED,
      },
    })

    const resumedTasks = []
    for (const task of pausedTasks) {
      const updated = await db.machiningTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.RUNNING,
          breakdownAt: null,
          breakdownNote: null,
          breakdownId: null,
          estimatedRecoveryDate: null,
          resolvedAt: new Date(),
        },
      })
      resumedTasks.push(updated)
    }

    return NextResponse.json({
      success: true,
      data: updatedBreakdown,
      resumedTasks: resumedTasks.length,
      message: `Breakdown resolved. ${resumedTasks.length} task(s) resumed.`,
    })
  } catch (error) {
    console.error('Error resolving breakdown:', error)
    return NextResponse.json({ error: 'Failed to resolve breakdown' }, { status: 500 })
  }
}

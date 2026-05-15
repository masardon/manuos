import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus, MachineStatus } from '@prisma/client'

const TENANT_ID = 'tenant_ypti'

// POST /api/breakdowns/[id]/reassign - Reassign tasks from broken machine to another
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: breakdownId } = await context.params
    const body = await request.json()

    if (!body.taskId || !body.newMachineId) {
      return NextResponse.json(
        { error: 'taskId and newMachineId are required' },
        { status: 400 }
      )
    }

    const breakdown = await db.breakdown.findFirst({
      where: { id: breakdownId, tenantId: TENANT_ID },
    })

    if (!breakdown) {
      return NextResponse.json({ error: 'Breakdown not found' }, { status: 404 })
    }

    const newMachine = await db.machine.findFirst({
      where: { id: body.newMachineId, tenantId: TENANT_ID, isActive: true },
    })

    if (!newMachine) {
      return NextResponse.json({ error: 'Target machine not found' }, { status: 404 })
    }

    if (newMachine.status === MachineStatus.DOWN) {
      return NextResponse.json(
        { error: 'Cannot assign to a machine that is DOWN' },
        { status: 400 }
      )
    }

    const task = await db.machiningTask.findFirst({
      where: { id: body.taskId, tenantId: TENANT_ID, breakdownId: breakdownId },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or not linked to this breakdown' },
        { status: 404 }
      )
    }

    // Reassign task to new machine
    const updatedTask = await db.machiningTask.update({
      where: { id: task.id },
      data: {
        machineId: body.newMachineId,
        status: TaskStatus.ASSIGNED,
        breakdownAt: null,
        breakdownNote: null,
        breakdownId: null,
        estimatedRecoveryDate: null,
        notes: `Reassigned from ${breakdown.machineId} to ${newMachine.code} due to breakdown`,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: `Task ${task.taskNumber} reassigned to ${newMachine.code} - ${newMachine.name}`,
    })
  } catch (error) {
    console.error('Error reassigning task:', error)
    return NextResponse.json({ error: 'Failed to reassign task' }, { status: 500 })
  }
}

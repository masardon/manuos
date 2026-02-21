import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const task = await db.machiningTask.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        machineId: body.machineId,
        assignedTo: body.assignedTo,
        plannedHours: body.plannedHours ? parseFloat(body.plannedHours) : null,
        plannedStartDate: body.plannedStartDate ? new Date(body.plannedStartDate) : null,
        plannedEndDate: body.plannedEndDate ? new Date(body.plannedEndDate) : null,
        status: body.status,
        progressPercent: body.progressPercent !== undefined ? parseInt(body.progressPercent) : undefined,
      },
      include: {
        machine: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      task,
      message: 'Task updated successfully',
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    await db.machiningTask.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

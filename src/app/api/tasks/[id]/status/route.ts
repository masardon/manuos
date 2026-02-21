import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// PUT /api/tasks/[id]/status - Update task status
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = [
      'PENDING',
      'ASSIGNED',
      'RUNNING',
      'PAUSED',
      'ON_HOLD',
      'COMPLETED',
      'CANCELLED',
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Find the task
    const task = await db.machiningTask.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Update task status
    const updatedTask = await db.machiningTask.update({
      where: { id },
      data: {
        status,
        // Update timestamps based on status transitions
        clockedInAt: status === 'RUNNING' && task.status !== 'RUNNING' ? new Date() : task.clockedInAt,
        clockedOutAt: status !== 'RUNNING' && task.status === 'RUNNING' ? new Date() : task.clockedOutAt,
      },
    })

    return NextResponse.json({
      task: {
        ...updatedTask,
        clockedInAt: updatedTask.clockedInAt?.toISOString() || null,
        clockedOutAt: updatedTask.clockedOutAt?.toISOString() || null,
      },
      message: 'Task status updated successfully',
    })
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    )
  }
}

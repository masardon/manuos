import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus } from '@prisma/client'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/jobsheet/[id]/tasks - Get all tasks for a jobsheet
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    const tasks = await db.machiningTask.findMany({
      where: { jobsheetId: id },
      include: {
        machine: true,
        assignedUser: true,
      },
      orderBy: {
        taskNumber: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/jobsheet/[id]/tasks - Create a new task
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      taskNumber,
      name,
      description,
      machineId,
      assignedTo,
      plannedHours,
      plannedStartDate,
      plannedEndDate,
    } = body

    if (!taskNumber || !name || !plannedHours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get jobsheet to get tenant and MO info
    const jobsheet = await db.jobsheet.findUnique({
      where: { id },
      include: {
        manufacturingOrder: {
          include: {
            order: true,
          },
        },
      },
    })

    if (!jobsheet) {
      return NextResponse.json(
        { error: 'Jobsheet not found' },
        { status: 404 }
      )
    }

    const task = await db.machiningTask.create({
      data: {
        tenantId: jobsheet.tenantId,
        jobsheetId: id,
        taskNumber,
        name,
        description,
        machineId: machineId || null,
        assignedTo: assignedTo || null,
        plannedHours: parseFloat(plannedHours),
        status: TaskStatus.PENDING,
        progressPercent: 0,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
      },
      include: {
        machine: true,
        assignedUser: true,
      },
    })

    return NextResponse.json({
      success: true,
      task,
      message: 'Task created successfully',
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// PUT /api/jobsheet/[id]/tasks/[taskId] - Update a task
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const body = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID required' },
        { status: 400 }
      )
    }

    const task = await db.machiningTask.update({
      where: { id: taskId },
      data: {
        name: body.name,
        description: body.description,
        machineId: body.machineId,
        assignedTo: body.assignedTo,
        plannedHours: body.plannedHours ? parseFloat(body.plannedHours) : undefined,
        status: body.status,
        progressPercent: body.progressPercent,
        clockedInAt: body.clockedInAt ? new Date(body.clockedInAt) : undefined,
        clockedOutAt: body.clockedOutAt ? new Date(body.clockedOutAt) : undefined,
        breakdownAt: body.breakdownAt ? new Date(body.breakdownAt) : undefined,
        breakdownNote: body.breakdownNote,
      },
      include: {
        machine: true,
        assignedUser: true,
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

// DELETE /api/jobsheet/[id]/tasks/[taskId] - Delete a task
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID required' },
        { status: 400 }
      )
    }

    await db.machiningTask.delete({
      where: { id: taskId },
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

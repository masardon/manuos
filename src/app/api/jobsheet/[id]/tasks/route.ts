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

    // Get jobsheet to get tenant and MO info
    const jobsheet = await db.jobsheet.findUnique({
      where: { id },
      include: {
        manufacturingOrder: true,
      },
    })

    if (!jobsheet) {
      return NextResponse.json(
        { error: 'Jobsheet not found' },
        { status: 404 }
      )
    }

    // Generate task number if not provided
    const taskNum = taskNumber || await generateTaskNumber(id)

    const task = await db.machiningTask.create({
      data: {
        tenantId: jobsheet.tenantId,
        jobsheetId: id,
        taskNumber: taskNum,
        name,
        description: description || null,
        machineId: machineId || null,
        assignedTo: assignedTo || null,
        plannedHours: plannedHours ? parseFloat(plannedHours) : null,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        status: TaskStatus.PENDING,
        progressPercent: 0,
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

// Helper function to generate task number
async function generateTaskNumber(jobsheetId: string) {
  const jobsheet = await db.jobsheet.findUnique({
    where: { id: jobsheetId },
    include: {
      machiningTasks: true,
    },
  })

  if (!jobsheet) return `TASK-${Date.now()}`

  const nextNum = jobsheet.machiningTasks.length + 1
  return `${jobsheet.jsNumber}-T${nextNum.toString().padStart(2, '0')}`
}

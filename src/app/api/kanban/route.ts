import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface TaskWithRelations {
  id: string
  taskNumber: string
  name: string
  description: string | null
  status: string
  machineId: string | null
  assignedTo: string | null
  plannedHours: number | null
  actualHours: number | null
  clockedInAt: string | null
  clockedOutAt: string | null
  breakdownAt: string | null
  progressPercent: number
  jobsheetId: string
  createdAt: string
  updatedAt: string
  machine?: {
    id: string
    code: string
    name: string
    type: string | null
  } | null
  jobsheet: {
    id: string
    jsNumber: string
    name: string
    manufacturingOrder: {
      id: string
      moNumber: string
      name: string
      order: {
        id: string
        orderNumber: string
        customerName: string
      }
    }
  }
}

// GET /api/kanban - Fetch tasks for Kanban board
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const machineId = searchParams.get('machineId')
    const assignedTo = searchParams.get('assignedTo')
    const moId = searchParams.get('moId')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}

    if (machineId) {
      where.machineId = machineId
    }

    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    if (moId) {
      where.jobsheet = {
        manufacturingOrderId: moId,
      }
    }

    if (orderId) {
      where.jobsheet = {
        manufacturingOrder: {
          orderId: orderId,
        },
      }
    }

    // Filter out cancelled tasks unless specifically requested
    if (!status || status !== 'CANCELLED') {
      if (status) {
        where.status = status
      } else {
        where.status = {
          not: 'CANCELLED',
        }
      }
    }

    // Fetch tasks with relations
    const tasks = await db.machiningTask.findMany({
      where,
      include: {
        machine: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        jobsheet: {
          select: {
            id: true,
            jsNumber: true,
            name: true,
            manufacturingOrder: {
              select: {
                id: true,
                moNumber: true,
                name: true,
                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { taskNumber: 'asc' },
      ],
    })

    // Format tasks with proper date serialization
    const formattedTasks: TaskWithRelations[] = tasks.map((task) => ({
      ...task,
      clockedInAt: task.clockedInAt?.toISOString() || null,
      clockedOutAt: task.clockedOutAt?.toISOString() || null,
      breakdownAt: task.breakdownAt?.toISOString() || null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }))

    // Calculate statistics
    const stats = {
      pending: tasks.filter((t) => t.status === 'PENDING').length,
      assigned: tasks.filter((t) => t.status === 'ASSIGNED').length,
      running: tasks.filter((t) => t.status === 'RUNNING').length,
      paused: tasks.filter((t) => t.status === 'PAUSED').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      onHold: tasks.filter((t) => t.status === 'ON_HOLD').length,
      cancelled: tasks.filter((t) => t.status === 'CANCELLED').length,
    }

    return NextResponse.json({
      tasks: formattedTasks,
      stats,
    })
  } catch (error) {
    console.error('Error fetching Kanban tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Kanban tasks' },
      { status: 500 }
    )
  }
}

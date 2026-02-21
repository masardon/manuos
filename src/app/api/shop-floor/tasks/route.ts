import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/shop-floor/tasks - Get tasks for shop floor view
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const assignedTo = searchParams.get('assignedTo')
    const status = searchParams.get('status')

    // Build filter
    const where: any = {}
    
    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    // Filter by status
    if (status === 'running') {
      // Currently being worked on (RUNNING or PAUSED, clocked in, not clocked out)
      where.OR = [
        { status: 'RUNNING' },
        { status: 'PAUSED' },
      ]
      where.clockedInAt = { not: null }
      where.clockedOutAt = null
    } else if (status === 'completed') {
      // Completed tasks
      where.status = 'COMPLETED'
    } else {
      // Default (todo): Show all active tasks that are not completed/cancelled and not currently running
      where.status = {
        notIn: ['COMPLETED', 'CANCELLED'],
      }
      // Exclude running/paused tasks (they have their own tab)
      where.OR = [
        { clockedInAt: null },
        { clockedOutAt: { not: null } },
      ]
    }

    // Get tasks with relations
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        jobsheet: {
          select: {
            id: true,
            jsNumber: true,
            name: true,
            progressPercent: true,
            status: true,
            drawingUrl: true,
            manufacturingOrder: {
              select: {
                id: true,
                moNumber: true,
                name: true,
                progressPercent: true,
                status: true,
                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                    progressPercent: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { clockedInAt: 'desc' }, // Clocked in tasks first
        { createdAt: 'asc' },
      ],
    })

    // Format tasks
    const formattedTasks = tasks.map((task) => ({
      ...task,
      clockedInAt: task.clockedInAt?.toISOString() || null,
      clockedOutAt: task.clockedOutAt?.toISOString() || null,
      breakdownAt: task.breakdownAt?.toISOString() || null,
      // Calculate quantity from task name or description
      quantity: extractQuantity(task.name, task.description),
    }))

    return NextResponse.json({
      success: true,
      tasks: formattedTasks,
      count: formattedTasks.length,
    })
  } catch (error) {
    console.error('Error fetching shop floor tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shop floor tasks' },
      { status: 500 }
    )
  }
}

// Helper function to extract quantity from task details
function extractQuantity(name: string | null, description: string | null): number | null {
  const text = `${name || ''} ${description || ''}`
  const match = text.match(/qty[:\s]*(\d+)/i) || text.match(/(\d+)\s*pcs/i)
  return match ? parseInt(match[1]) : null
}

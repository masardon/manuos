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

    // Filter by running status (clocked in but not clocked out)
    if (status === 'running') {
      where.clockedInAt = { not: null }
      where.clockedOutAt = null
    } else if (status === 'pending') {
      // Show tasks that are not currently being worked on
      where.OR = [
        { clockedInAt: null },
        { clockedOutAt: { not: null } },
      ]
    } else {
      // Default: show all active tasks (not completed or cancelled)
      where.status = {
        notIn: ['COMPLETED', 'CANCELLED'],
      }
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
            drawingUrl: true,
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

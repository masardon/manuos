import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/tasks/[id]/detail - Get task details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const tenantId = 'tenant_ypti' // Default to YPTI for demo

    const task = await db.machiningTask.findUnique({
      where: { id },
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      task: {
        ...task,
        clockedInAt: task.clockedInAt?.toISOString() || null,
        clockedOutAt: task.clockedOutAt?.toISOString() || null,
        breakdownAt: task.breakdownAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('Error fetching task details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task details' },
      { status: 500 }
    )
  }
}

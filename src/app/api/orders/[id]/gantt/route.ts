import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/orders/[id]/gantt - Get order details with MOs and jobsheets for Gantt chart
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        manufacturingOrders: {
          select: {
            id: true,
            moNumber: true,
            name: true,
            status: true,
            progressPercent: true,
            plannedStartDate: true,
            plannedEndDate: true,
            jobsheets: {
              select: {
                id: true,
                jsNumber: true,
                name: true,
                status: true,
                progressPercent: true,
                plannedStartDate: true,
                plannedEndDate: true,
              },
              orderBy: {
                jsNumber: 'asc',
              },
            },
          },
          orderBy: {
            moNumber: 'asc',
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order: {
        ...order,
        plannedStartDate: order.plannedStartDate?.toISOString() || null,
        plannedEndDate: order.plannedEndDate?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('Error fetching order Gantt data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order Gantt data' },
      { status: 500 }
    )
  }
}

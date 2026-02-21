import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/orders/[id] - Get order details with MOs
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
            description: true,
            status: true,
            progressPercent: true,
            plannedStartDate: true,
            plannedEndDate: true,
            jobsheets: {
              select: {
                id: true,
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
        actualStartDate: order.actualStartDate?.toISOString() || null,
        actualEndDate: order.actualEndDate?.toISOString() || null,
        manufacturingOrders: order.manufacturingOrders.map((mo) => ({
          ...mo,
          jobsheetsCount: mo.jobsheets.length,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}

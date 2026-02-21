import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/production - Get production data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get orders with related data
    const orders = await db.order.findMany({
      where: {
        tenantId: 'tenant_default',
      },
      include: {
        manufacturingOrders: {
          include: {
            jobsheets: {
              include: {
                tasks: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        progressPercent: order.progressPercent || 0,
        taskCount: order.manufacturingOrders.reduce((sum, mo) =>
          sum + mo.jobsheets.reduce((sum2, js) => sum2 + js.tasks.length, 0), 0
        ),
      })),
    })
  } catch (error) {
    console.error('Error generating production report:', error)
    return NextResponse.json(
      { error: 'Failed to generate production report' },
      { status: 500 }
    )
  }
}

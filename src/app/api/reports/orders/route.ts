import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/orders - Get order summary data
export async function GET(request: NextRequest) {
  try {
    const orders = await db.order.findMany({
      where: {
        tenantId: 'tenant_default',
      },
      include: {
        manufacturingOrders: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const statusDistribution = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalProgress = orders.reduce((sum, order) => sum + (order.progressPercent || 0), 0)
    const avgProgress = orders.length > 0 ? totalProgress / orders.length : 0

    return NextResponse.json({
      success: true,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        progressPercent: order.progressPercent || 0,
        plannedStartDate: order.plannedStartDate,
        plannedEndDate: order.plannedEndDate,
        actualStartDate: order.actualStartDate,
        actualEndDate: order.actualEndDate,
        moCount: order.manufacturingOrders.length,
      })),
      statistics: {
        total: orders.length,
        avgProgress: avgProgress.toFixed(1),
        statusDistribution,
      },
    })
  } catch (error) {
    console.error('Error generating orders report:', error)
    return NextResponse.json(
      { error: 'Failed to generate orders report' },
      { status: 500 }
    )
  }
}

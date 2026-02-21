import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getTenantId } from '@/lib/middleware/auth'
import { OrderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request.headers)
    
    // Get tenant ID
    const tenantId = user?.tenantId || 'tenant_default'

    // Get all orders
    const orders = await db.order.findMany({
      where: {
        tenantId,
        status: {
          notIn: [OrderStatus.CANCELLED],
        },
      },
      include: {
        manufacturingOrders: {
          select: {
            id: true,
            moNumber: true,
            status: true,
            progressPercent: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform orders for display
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      progressPercent: order.progressPercent || 0,
      createdAt: order.createdAt.toISOString(),
      manufacturingOrdersCount: order.manufacturingOrders.length,
    }))

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      count: formattedOrders.length,
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

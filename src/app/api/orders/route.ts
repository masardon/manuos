import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getTenantId } from '@/lib/middleware/auth'
import { OrderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request.headers)

    // Get tenant ID
    const tenantId = user?.tenantId || 'tenant_ypti'

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
            name: true,
            status: true,
            progressPercent: true,
            jobsheets: {
              select: {
                id: true,
                jsNumber: true,
                name: true,
                status: true,
                progressPercent: true,
                plannedStartDate: true,
                plannedEndDate: true,
                machiningTasks: true,
              },
            },
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
      manufacturingOrders: order.manufacturingOrders.map((mo) => ({
        ...mo,
        jobsheetsCount: mo.jobsheets.length,
      })),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      description,
      notes,
      plannedStartDate,
      plannedEndDate,
      drawingUrl,
      drawings,
    } = body

    if (!orderNumber || !customerName || !plannedStartDate || !plannedEndDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const tenantId = 'tenant_ypti' // Default tenant for demo
    const boardId = 'board_main' // Default board

    // Create the order with DRAFT status
    const order = await db.order.create({
      data: {
        tenantId,
        boardId,
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        description,
        notes,
        drawingUrl: drawings?.[0] || drawingUrl,
        status: OrderStatus.DRAFT,
        plannedStartDate: new Date(plannedStartDate),
        plannedEndDate: new Date(plannedEndDate),
        progressPercent: 0,
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
      message: 'Order created successfully. Pending engineering review.',
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

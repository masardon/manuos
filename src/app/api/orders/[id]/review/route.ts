import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { OrderStatus } from '@prisma/client'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/orders/[id]/review - Submit order for customer review
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT orders can be submitted for review' },
        { status: 400 }
      )
    }

    // Update order status to MATERIAL_PREPARATION (awaiting customer approval)
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: OrderStatus.MATERIAL_PREPARATION,
      },
    })

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order submitted for customer review',
    })
  } catch (error) {
    console.error('Error submitting order for review:', error)
    return NextResponse.json(
      { error: 'Failed to submit order for review' },
      { status: 500 }
    )
  }
}

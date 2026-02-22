import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MOStatus } from '@prisma/client'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/orders/[id]/mo - Create a new MO for an order
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      moNumber,
      name,
      description,
      plannedStartDate,
      plannedEndDate,
    } = body

    // Get order to get tenant info
    const order = await db.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const mo = await db.manufacturingOrder.create({
      data: {
        tenantId: order.tenantId,
        orderId: id,
        moNumber,
        name,
        description: description || null,
        status: MOStatus.PLANNED,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        progressPercent: 0,
      },
    })

    return NextResponse.json({
      success: true,
      mo,
      message: 'MO created successfully',
    })
  } catch (error) {
    console.error('Error creating MO:', error)
    return NextResponse.json(
      { error: 'Failed to create MO' },
      { status: 500 }
    )
  }
}

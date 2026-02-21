import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { OrderStatus } from '@prisma/client'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/orders/[id]/approve - Approve order and generate MOs
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, approvalNotes } = body

    // action can be: 'submit_for_review', 'approve_engineering', 'send_to_client', 'approve_client', 'reject'
    
    const order = await db.order.findUnique({
      where: { id },
      include: {
        manufacturingOrders: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    let newStatus = order.status
    let message = ''

    switch (action) {
      case 'submit_for_review':
        // Marketing submits order for engineering review
        if (order.status !== OrderStatus.DRAFT) {
          return NextResponse.json(
            { error: 'Only draft orders can be submitted for review' },
            { status: 400 }
          )
        }
        newStatus = OrderStatus.PLANNING
        message = 'Order submitted for engineering review'
        break

      case 'approve_engineering':
        // PPIC/Engineering approves the plan
        if (order.status !== OrderStatus.PLANNING) {
          return NextResponse.json(
            { error: 'Order must be in planning status' },
            { status: 400 }
          )
        }
        newStatus = OrderStatus.MATERIAL_PREPARATION
        message = 'Engineering plan approved, ready for client approval'
        break

      case 'send_to_client':
        // Send to client for approval
        if (order.status !== OrderStatus.MATERIAL_PREPARATION) {
          return NextResponse.json(
            { error: 'Order must have engineering plan ready' },
            { status: 400 }
          )
        }
        message = 'Plan sent to client for approval'
        break

      case 'approve_client':
        // Client approves the plan - Generate Manufacturing Orders!
        if (order.status !== OrderStatus.MATERIAL_PREPARATION) {
          return NextResponse.json(
            { error: 'Order must be awaiting client approval' },
            { status: 400 }
          )
        }
        newStatus = OrderStatus.IN_PRODUCTION
        message = 'Client approved! Manufacturing orders generated.'
        
        // Auto-generate first Manufacturing Order when client approves
        await db.manufacturingOrder.create({
          data: {
            tenantId: order.tenantId,
            orderId: order.id,
            moNumber: `${order.orderNumber}-MO001`,
            name: `Production Batch 1 - ${order.customerName}`,
            status: 'PLANNED',
            plannedStartDate: order.plannedStartDate,
            plannedEndDate: order.plannedEndDate,
            progressPercent: 0,
          },
        })
        break

      case 'reject':
        // Reject and send back to previous stage
        if (order.status === OrderStatus.PLANNING) {
          newStatus = OrderStatus.DRAFT
          message = 'Order rejected, sent back to marketing'
        } else if (order.status === OrderStatus.MATERIAL_PREPARATION) {
          newStatus = OrderStatus.PLANNING
          message = 'Engineering plan rejected, needs revision'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: { id },
      data: {
        status: newStatus,
        notes: approvalNotes ? `${order.notes || ''}\n\n[Approval Note]: ${approvalNotes}` : order.notes,
      },
      include: {
        manufacturingOrders: true,
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        manufacturingOrdersCount: updatedOrder.manufacturingOrders.length,
      },
      message,
    })
  } catch (error) {
    console.error('Error processing order approval:', error)
    return NextResponse.json(
      { error: 'Failed to process order approval' },
      { status: 500 }
    )
  }
}

// GET /api/orders/[id]/approve - Get order approval status
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        manufacturingOrders: {
          include: {
            jobsheets: {
              include: {
                machiningTasks: {
                  include: {
                    machine: true,
                    assignedUser: true,
                  },
                },
              },
            },
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
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        progressPercent: order.progressPercent,
        plannedStartDate: order.plannedStartDate,
        plannedEndDate: order.plannedEndDate,
        description: order.description,
        notes: order.notes,
        drawingUrl: order.drawingUrl,
        manufacturingOrdersCount: order.manufacturingOrders.length,
        manufacturingOrders: order.manufacturingOrders.map((mo) => ({
          id: mo.id,
          moNumber: mo.moNumber,
          name: mo.name,
          status: mo.status,
          progressPercent: mo.progressPercent,
          jobsheetsCount: mo.jobsheets?.length || 0,
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

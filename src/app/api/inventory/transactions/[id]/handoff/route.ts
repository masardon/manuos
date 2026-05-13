// Digital Handoffs Update API - Track shipment status
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const updateHandoffSchema = z.object({
  handoffStatus: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED', 'DELAYED', 'LOST']),
  actualDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

// PUT /api/inventory/transactions/[id]/handoff - Update handoff status
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params
    const body = await request.json()
    const data = updateHandoffSchema.parse(body)

    // Check transaction exists
    const transaction = await db.inventoryTransaction.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        type: 'TRANSFER', // Only transfers can have handoff status
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found or not a transfer' }, { status: 404 })
    }

    // Update handoff status
    const updated = await db.inventoryTransaction.update({
      where: { id },
      data: {
        handoffStatus: data.handoffStatus,
        actualDate: data.actualDate ? new Date(data.actualDate) : 
                    data.handoffStatus === 'DELIVERED' || data.handoffStatus === 'CONFIRMED' 
                      ? new Date() 
                      : transaction.actualDate,
        notes: data.notes || transaction.notes,
      }
    })

    // If delivered/confirmed, update inventory location
    if ((data.handoffStatus === 'DELIVERED' || data.handoffStatus === 'CONFIRMED') && transaction.toLocation) {
      await db.inventory.update({
        where: { id: transaction.inventoryId },
        data: { location: transaction.toLocation }
      })
    }

    return NextResponse.json({
      success: true,
      transaction: updated,
      message: `Handoff status updated to ${data.handoffStatus}`
    })
  } catch (error) {
    console.error('Error updating handoff:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update handoff' }, { status: 500 })
  }
}

// GET /api/inventory/transactions/[id]/handoff - Get handoff details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params

    const transaction = await db.inventoryTransaction.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        inventory: {
          select: { id: true, partNumber: true, name: true, unit: true }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Get transaction timeline
    const timeline = await db.inventoryTransaction.findMany({
      where: {
        inventoryId: transaction.inventoryId,
        referenceType: transaction.referenceType,
        referenceId: transaction.referenceId,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        quantity: true,
        handoffStatus: true,
        expectedDate: true,
        actualDate: true,
        carrier: true,
        trackingNumber: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      transaction,
      timeline
    })
  } catch (error) {
    console.error('Error fetching handoff:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch handoff' }, { status: 500 })
  }
}

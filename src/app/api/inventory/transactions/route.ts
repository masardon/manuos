// Inventory Transactions API - Digital Handoffs and Stock Movements
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const createTransactionSchema = z.object({
  inventoryId: z.string().min(1),
  type: z.enum(['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'CONSUMPTION']),
  quantity: z.number(),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  fromBatch: z.string().optional(),
  toBatch: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  orderId: z.string().optional(),
  moId: z.string().optional(),
  // Digital handoff fields
  handoffStatus: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED', 'DELAYED', 'LOST']).optional(),
  expectedDate: z.string().datetime().optional(),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
})

const updateHandoffSchema = z.object({
  handoffStatus: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED', 'DELAYED', 'LOST']),
  actualDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

// GET /api/inventory/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const inventoryId = searchParams.get('inventoryId')
    const type = searchParams.get('type')
    const handoffStatus = searchParams.get('handoffStatus')
    const referenceType = searchParams.get('referenceType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = { tenantId: user.tenantId }
    if (inventoryId) where.inventoryId = inventoryId
    if (type) where.type = type
    if (handoffStatus) where.handoffStatus = handoffStatus
    if (referenceType) where.referenceType = referenceType
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const transactions = await db.inventoryTransaction.findMany({
      where,
      include: {
        inventory: {
          select: { id: true, partNumber: true, name: true, unit: true }
        },
        purchaseOrder: {
          select: { id: true, poNumber: true }
        },
        order: {
          select: { id: true, orderNumber: true, customerName: true }
        },
        mo: {
          select: { id: true, moNumber: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Group by handoff status for summary
    const handoffSummary = transactions.reduce((acc, t) => {
      if (t.handoffStatus) {
        acc[t.handoffStatus] = (acc[t.handoffStatus] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
      handoffSummary
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST /api/inventory/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const data = createTransactionSchema.parse(body)

    // Check inventory exists
    const inventory = await db.inventory.findFirst({
      where: {
        id: data.inventoryId,
        tenantId: user.tenantId
      }
    })

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    }

    // Calculate new quantities
    let newQuantity = inventory.quantity
    let newReservedQty = inventory.reservedQty
    let newAvailableQty = inventory.availableQty

    switch (data.type) {
      case 'RECEIPT':
        newQuantity += data.quantity
        newAvailableQty += data.quantity
        break
      case 'ISSUE':
      case 'CONSUMPTION':
        if (data.quantity > inventory.availableQty) {
          return NextResponse.json(
            { error: 'Insufficient available quantity', available: inventory.availableQty },
            { status: 400 }
          )
        }
        newQuantity -= data.quantity
        newAvailableQty -= data.quantity
        break
      case 'TRANSFER':
        // Transfer doesn't change total quantity, just location
        break
      case 'ADJUSTMENT':
        newQuantity = data.quantity
        newAvailableQty = data.quantity - inventory.reservedQty
        break
      case 'RETURN':
        newQuantity += data.quantity
        newAvailableQty += data.quantity
        break
    }

    // Create transaction and update inventory atomically
    const [transaction] = await db.$transaction([
      db.inventoryTransaction.create({
        data: {
          tenantId: user.tenantId,
          inventoryId: data.inventoryId,
          type: data.type,
          quantity: data.type === 'ISSUE' || data.type === 'CONSUMPTION' ? -data.quantity : data.quantity,
          balance: newQuantity,
          fromLocation: data.fromLocation,
          toLocation: data.toLocation,
          fromBatch: data.fromBatch,
          toBatch: data.toBatch,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          purchaseOrderId: data.purchaseOrderId,
          orderId: data.orderId,
          moId: data.moId,
          handoffStatus: data.handoffStatus,
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          carrier: data.carrier,
          trackingNumber: data.trackingNumber,
          notes: data.notes,
          createdBy: user.id,
        }
      }),
      db.inventory.update({
        where: { id: data.inventoryId },
        data: {
          quantity: newQuantity,
          reservedQty: newReservedQty,
          availableQty: newAvailableQty,
          location: data.toLocation || inventory.location,
          batch: data.toBatch || inventory.batch,
          status: newAvailableQty > 0 ? (newReservedQty > 0 ? 'RESERVED' : 'AVAILABLE') : 'WIP'
        }
      })
    ])

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction recorded successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

// Inventory Transactions API - Digital Handoffs and Stock Movements
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'
import { recordInventoryMovement } from '@/lib/inventory/inventory-ledger'

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

    // Create transaction using inventory ledger service
    const result = await recordInventoryMovement({
      tenantId: user.tenantId,
      inventoryId: data.inventoryId,
      type: data.type as any,
      quantity: data.type === 'ISSUE' || data.type === 'CONSUMPTION' ? -data.quantity : data.quantity,
      referenceType: data.referenceType || 'MANUAL',
      referenceId: data.referenceId || '',
      fromLocationId: data.fromLocation,
      toLocationId: data.toLocation,
      performedBy: user.id,
      notes: data.notes,
    })

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      newBalance: result.newBalance,
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

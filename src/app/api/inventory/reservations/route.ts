// Inventory Reservations API - Create, Update, Release reservations
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'
import { reserveInventoryForMO } from '@/lib/inventory/inventory-ledger'

const createReservationSchema = z.object({
  inventoryId: z.string().min(1),
  orderId: z.string().optional(),
  moId: z.string().optional(),
  quantity: z.number().min(0.01),
  notes: z.string().optional(),
})

const updateReservationSchema = z.object({
  status: z.enum(['ALLOCATED', 'CONFIRMED', 'PARTIALLY_CONSUMED', 'CONSUMED', 'RELEASED', 'CANCELLED']),
  notes: z.string().optional(),
})

// GET /api/inventory/reservations - List reservations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const inventoryId = searchParams.get('inventoryId')
    const orderId = searchParams.get('orderId')
    const moId = searchParams.get('moId')
    const status = searchParams.get('status')

    const where: any = { tenantId: user.tenantId }
    if (inventoryId) where.inventoryId = inventoryId
    if (orderId) where.orderId = orderId
    if (moId) where.moId = moId
    if (status) where.status = status

    const reservations = await db.inventoryReservation.findMany({
      where,
      include: {
        inventory: {
          select: { id: true, partNumber: true, name: true, unit: true }
        },
        order: {
          select: { id: true, orderNumber: true, customerName: true }
        },
        mo: {
          select: { id: true, moNumber: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}

// POST /api/inventory/reservations - Create new reservation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const data = createReservationSchema.parse(body)

    // Create reservation using inventory ledger service
    const reservation = await reserveInventoryForMO({
      tenantId: user.tenantId,
      inventoryId: data.inventoryId,
      moId: data.moId || '',
      quantity: data.quantity,
      reservedBy: user.id,
    })

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reservation created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}

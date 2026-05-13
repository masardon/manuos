// Inventory Reservations API - Create, Update, Release reservations
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

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

    // Check inventory exists and has enough available quantity
    const inventory = await db.inventory.findFirst({
      where: {
        id: data.inventoryId,
        tenantId: user.tenantId
      }
    })

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    }

    if (inventory.availableQty < data.quantity) {
      return NextResponse.json(
        { 
          error: 'Insufficient available quantity',
          available: inventory.availableQty,
          requested: data.quantity
        },
        { status: 400 }
      )
    }

    // Create reservation and update inventory atomically
    const [reservation] = await db.$transaction([
      db.inventoryReservation.create({
        data: {
          tenantId: user.tenantId,
          inventoryId: data.inventoryId,
          orderId: data.orderId,
          moId: data.moId,
          quantity: data.quantity,
          status: 'ALLOCATED',
          notes: data.notes,
          createdBy: user.id,
        }
      }),
      db.inventory.update({
        where: { id: data.inventoryId },
        data: {
          reservedQty: { increment: data.quantity },
          availableQty: { decrement: data.quantity },
          status: 'RESERVED'
        }
      })
    ])

    // Create transaction log
    await db.inventoryTransaction.create({
      data: {
        tenantId: user.tenantId,
        inventoryId: data.inventoryId,
        type: 'RESERVATION',
        quantity: -data.quantity,
        balance: inventory.quantity - inventory.reservedQty - data.quantity,
        referenceType: data.orderId ? 'ORDER' : data.moId ? 'MO' : 'RESERVATION',
        referenceId: data.orderId || data.moId || reservation.id,
        notes: `Reservation: ${data.notes || 'No notes'}`,
        createdBy: user.id,
      }
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

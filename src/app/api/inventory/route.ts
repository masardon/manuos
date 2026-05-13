// Comprehensive Inventory API - Full CRUD with reservations, transactions
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, hasRole } from '@/lib/auth/middleware'
import { z } from 'zod'

// Validation schemas
const createInventorySchema = z.object({
  partNumber: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  batch: z.string().optional(),
  quantity: z.number().min(0).default(0),
  unit: z.string().optional(),
  location: z.string().optional(),
  shelf: z.string().optional(),
  supplierId: z.string().optional(),
  supplierRef: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  currency: z.string().default('IDR'),
  reorderPoint: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
  expiryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

const updateInventorySchema = createInventorySchema.partial()

const reservationSchema = z.object({
  inventoryId: z.string().min(1),
  orderId: z.string().optional(),
  moId: z.string().optional(),
  quantity: z.number().min(0.01),
  notes: z.string().optional(),
})

const transactionSchema = z.object({
  inventoryId: z.string().min(1),
  type: z.enum(['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'CONSUMPTION']),
  quantity: z.number(),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/inventory - List inventory with filters
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const location = searchParams.get('location')
    const lowStock = searchParams.get('lowStock') === 'true'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: user.tenantId,
    }

    if (category) where.category = category
    if (status) where.status = status
    if (location) where.location = { contains: location }
    if (search) {
      where.OR = [
        { partNumber: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [inventory, total] = await Promise.all([
      db.inventory.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { reservations: true, transactions: true }
          }
        },
        orderBy: { partNumber: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.inventory.count({ where })
    ])

    // Calculate low stock items
    let lowStockCount = 0
    const enrichedInventory = inventory.map(item => {
      const isLowStock = item.reorderPoint && item.availableQty <= item.reorderPoint
      if (isLowStock) lowStockCount++
      return {
        ...item,
        isLowStock,
        utilizationRate: item.quantity > 0 ? (item.reservedQty / item.quantity * 100).toFixed(1) : '0'
      }
    })

    // Get summary stats
    const stats = await db.inventory.aggregate({
      where: { tenantId: user.tenantId },
      _sum: {
        quantity: true,
        reservedQty: true,
        availableQty: true
      },
      _count: true
    })

    // Get counts by status
    const statusCounts = await db.inventory.groupBy({
      by: ['status'],
      where: { tenantId: user.tenantId },
      _count: true
    })

    return NextResponse.json({
      success: true,
      inventory: enrichedInventory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalItems: stats._count,
        totalQuantity: stats._sum.quantity || 0,
        totalReserved: stats._sum.reservedQty || 0,
        totalAvailable: stats._sum.availableQty || 0,
        lowStockCount
      },
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const data = createInventorySchema.parse(body)

    // Calculate available quantity
    const availableQty = data.quantity

    const inventory = await db.inventory.create({
      data: {
        tenantId: user.tenantId,
        ...data,
        availableQty,
        status: availableQty > 0 ? 'AVAILABLE' : 'WIP',
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      }
    })

    // Create initial transaction if quantity > 0
    if (data.quantity > 0) {
      await db.inventoryTransaction.create({
        data: {
          tenantId: user.tenantId,
          inventoryId: inventory.id,
          type: 'RECEIPT',
          quantity: data.quantity,
          balance: data.quantity,
          toLocation: data.location,
          referenceType: 'INITIAL',
          notes: 'Initial stock entry',
          createdBy: user.id,
        }
      })
    }

    return NextResponse.json({
      success: true,
      inventory,
      message: 'Inventory item created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 })
  }
}

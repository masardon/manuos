// Single Inventory Item API - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const updateInventorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  location: z.string().optional(),
  shelf: z.string().optional(),
  supplierId: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'WIP', 'USED', 'EXPIRED']).optional(),
  notes: z.string().optional(),
})

// GET /api/inventory/[id] - Get single inventory item with full details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params

    const inventory = await db.inventory.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        supplier: true,
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            order: { select: { orderNumber: true, customerName: true } },
            mo: { select: { moNumber: true, name: true } }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        recipeIngredients: {
          include: {
            recipe: { select: { code: true, name: true } }
          }
        }
      }
    })

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    }

    // Calculate metrics
    const utilizationRate = inventory.quantity > 0 
      ? (inventory.reservedQty / inventory.quantity * 100).toFixed(1) 
      : '0'
    
    const isLowStock = inventory.reorderPoint && inventory.availableQty <= inventory.reorderPoint

    return NextResponse.json({
      success: true,
      inventory: {
        ...inventory,
        utilizationRate,
        isLowStock,
        daysOfSupply: null, // Would need consumption history
      }
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params
    const body = await request.json()
    const data = updateInventorySchema.parse(body)

    // Check if item exists
    const existing = await db.inventory.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    }

    // Update inventory
    const updated = await db.inventory.update({
      where: { id },
      data: {
        ...data,
        availableQty: data.quantity !== undefined 
          ? data.quantity - existing.reservedQty 
          : existing.availableQty,
      }
    })

    return NextResponse.json({
      success: true,
      inventory: updated,
      message: 'Inventory updated successfully'
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params

    // Check if item exists
    const existing = await db.inventory.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        _count: {
          select: { reservations: true }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 })
    }

    // Check for active reservations
    const activeReservations = await db.inventoryReservation.count({
      where: {
        inventoryId: id,
        status: { in: ['ALLOCATED', 'CONFIRMED'] }
      }
    })

    if (activeReservations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete item with active reservations. Release reservations first.' },
        { status: 400 }
      )
    }

    await db.inventory.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Inventory deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting inventory:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete inventory' }, { status: 500 })
  }
}

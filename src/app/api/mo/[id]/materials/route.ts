// Material Requirements API - PPIC material planning for Manufacturing Orders
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { 
  addMaterialRequirements, 
  autoReserveMaterials, 
  generatePurchaseRequests,
  executeMaterialPlanningWorkflow,
  receiveGoods
} from '@/lib/inventory/material-requirements'
import { z } from 'zod'

const materialInputSchema = z.object({
  partNumber: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  requiredQty: z.number().min(0.01),
  unit: z.string().optional(),
  requiredDate: z.string().datetime(),
  priority: z.number().min(1).max(10).optional(),
  specifications: z.string().optional(),
  inventoryId: z.string().optional(),
})

const addMaterialsSchema = z.object({
  materials: z.array(materialInputSchema).min(1),
})

const workflowSchema = z.object({
  materials: z.array(materialInputSchema).min(1),
  pushToOdoo: z.boolean().default(false),
})

const receiveGoodsSchema = z.object({
  purchaseRequestId: z.string().min(1),
  receivedItems: z.array(z.object({
    prItemId: z.string(),
    receivedQty: z.number().min(0.01),
    location: z.string().optional(),
    batch: z.string().optional(),
  })).min(1),
})

// GET /api/mo/[id]/materials - Get material requirements for MO
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: moId } = await context.params

    // Verify MO exists
    const mo = await db.manufacturingOrder.findFirst({
      where: { id: moId, tenantId: user.tenantId },
      include: {
        order: { select: { orderNumber: true, customerName: true } }
      }
    })

    if (!mo) {
      return NextResponse.json({ error: 'Manufacturing Order not found' }, { status: 404 })
    }

    // Get material requirements
    const requirements = await db.materialRequirement.findMany({
      where: { tenantId: user.tenantId, moId },
      include: {
        inventory: {
          select: { id: true, partNumber: true, name: true, availableQty: true, location: true, quantity: true }
        },
        reservations: {
          include: {
            inventory: { select: { partNumber: true, name: true, location: true, batch: true, shelf: true } }
          }
        },
        purchaseRequestItems: {
          include: {
            purchaseRequest: { select: { prNumber: true, status: true } }
          }
        }
      },
      orderBy: [
        { priority: 'asc' },
        { requiredDate: 'asc' }
      ]
    })

    // Calculate summary
    const summary = {
      totalMaterials: requirements.length,
      totalRequiredQty: requirements.reduce((sum, r) => sum + r.requiredQty, 0),
      totalReservedQty: requirements.reduce((sum, r) => sum + r.reservedQty, 0),
      totalRequestedQty: requirements.reduce((sum, r) => sum + r.requestedQty, 0),
      fullyReserved: requirements.filter(r => r.status === 'RESERVED').length,
      partiallyReserved: requirements.filter(r => r.status === 'PARTIALLY_RESERVED').length,
      needsPurchase: requirements.filter(r => r.status === 'PURCHASE_REQUESTED').length,
      pending: requirements.filter(r => r.status === 'PLANNED').length,
    }

    return NextResponse.json({
      success: true,
      mo: {
        id: mo.id,
        moNumber: mo.moNumber,
        name: mo.name,
        orderNumber: mo.order.orderNumber,
        customerName: mo.order.customerName
      },
      requirements,
      summary
    })
  } catch (error) {
    console.error('Error fetching material requirements:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch material requirements' }, { status: 500 })
  }
}

// POST /api/mo/[id]/materials - Add materials to MO
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: moId } = await context.params
    const body = await request.json()
    const data = addMaterialsSchema.parse(body)

    // Verify MO exists
    const mo = await db.manufacturingOrder.findFirst({
      where: { id: moId, tenantId: user.tenantId }
    })

    if (!mo) {
      return NextResponse.json({ error: 'Manufacturing Order not found' }, { status: 404 })
    }

    const results = await addMaterialRequirements(
      user.tenantId,
      moId,
      data.materials,
      user.id
    )

    return NextResponse.json({
      success: true,
      results,
      message: `Added ${data.materials.length} material requirements`
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding material requirements:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to add material requirements' }, { status: 500 })
  }
}

// POST /api/mo/[id]/materials/reserve - Auto-reserve materials from stock
export async function reserveMaterials(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: moId } = await context.params

    const results = await autoReserveMaterials(user.tenantId, moId, user.id)

    return NextResponse.json({
      success: true,
      results,
      summary: {
        reserved: results.filter(r => r.status === 'RESERVED' || r.status === 'PARTIALLY_RESERVED').length,
        noStock: results.filter(r => r.status === 'NO_STOCK').length
      }
    })
  } catch (error) {
    console.error('Error reserving materials:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to reserve materials' }, { status: 500 })
  }
}

// POST /api/mo/[id]/materials/purchase-request - Generate purchase request
export async function createPurchaseRequest(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: moId } = await context.params

    const result = await generatePurchaseRequests(user.tenantId, moId, user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating purchase request:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create purchase request' }, { status: 500 })
  }
}

// POST /api/mo/[id]/materials/workflow - Execute full workflow (add + reserve + PR + Odoo)
export async function executeWorkflow(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: moId } = await context.params
    const body = await request.json()
    const data = workflowSchema.parse(body)

    const result = await executeMaterialPlanningWorkflow(
      user.tenantId,
      moId,
      data.materials,
      user.id,
      data.pushToOdoo
    )

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error executing workflow:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to execute workflow' }, { status: 500 })
  }
}

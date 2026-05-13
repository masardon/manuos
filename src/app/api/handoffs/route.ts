// Material Handoffs API - Digital handoffs for material movement
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { 
  createMaterialHandoff, 
  confirmHandoffReceipt,
  issueToProduction,
  moveToPPICRack,
  distributeToWorkstation,
  getMaterialTrackingSummary
} from '@/lib/inventory/material-handoff'
import { z } from 'zod'

const handoffItemSchema = z.object({
  inventoryId: z.string().min(1),
  quantity: z.number().min(0.01),
  unit: z.string().optional(),
  fromBatch: z.string().optional(),
  toBatch: z.string().optional(),
  fromShelf: z.string().optional(),
  toShelf: z.string().optional(),
  condition: z.string().optional(),
  materialRequirementId: z.string().optional(),
})

const createHandoffSchema = z.object({
  fromLocationId: z.string().min(1),
  toLocationId: z.string().min(1),
  fromPicUserId: z.string().optional(),
  toPicUserId: z.string().optional(),
  handoffType: z.enum(['STOCK_TRANSFER', 'MATERIAL_REQUEST', 'ISSUE_TO_PRODUCTION', 'CONSUMPTION_RETURN', 'QC_TRANSFER', 'REWORK', 'ADJUSTMENT']).optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  moId: z.string().optional(),
  jobsheetId: z.string().optional(),
  taskId: z.string().optional(),
  notes: z.string().optional(),
  deliveryNote: z.string().optional(),
  items: z.array(handoffItemSchema).min(1),
})

const confirmReceiptSchema = z.object({
  notes: z.string().optional(),
})

const issueToProductionSchema = z.object({
  moId: z.string().min(1),
  toWorkstationId: z.string().optional(),
  items: z.array(z.object({
    inventoryId: z.string().min(1),
    quantity: z.number().min(0.01),
    materialRequirementId: z.string().optional(),
  })).min(1),
})

const moveToPPICSchema = z.object({
  moId: z.string().min(1),
  items: z.array(z.object({
    inventoryId: z.string().min(1),
    quantity: z.number().min(0.01),
    materialRequirementId: z.string().optional(),
  })).min(1),
})

// GET /api/handoffs - List handoffs
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const status = searchParams.get('status')
    const moId = searchParams.get('moId')
    const fromLocationId = searchParams.get('fromLocationId')
    const toLocationId = searchParams.get('toLocationId')
    const handoffType = searchParams.get('handoffType')
    const days = parseInt(searchParams.get('days') || '30')

    const where: any = { tenantId: user.tenantId }
    if (status) where.status = status
    if (moId) where.moId = moId
    if (fromLocationId) where.fromLocationId = fromLocationId
    if (toLocationId) where.toLocationId = toLocationId
    if (handoffType) where.handoffType = handoffType
    
    // Date filter
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    where.createdAt = { gte: startDate }

    const handoffs = await db.materialHandoff.findMany({
      where,
      include: {
        fromLocation: { select: { id: true, name: true, code: true, type: true } },
        toLocation: { select: { id: true, name: true, code: true, type: true } },
        handedByUser: { select: { id: true, name: true, email: true } },
        receivedByUser: { select: { id: true, name: true, email: true } },
        mo: { select: { id: true, moNumber: true, name: true } },
        jobsheet: { select: { id: true, jsNumber: true, name: true } },
        task: { select: { id: true, taskNumber: true, name: true } },
        items: {
          include: {
            inventory: { select: { id: true, partNumber: true, name: true } }
          }
        },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Summary by status
    const statusSummary = await db.materialHandoff.groupBy({
      by: ['status'],
      where: { tenantId: user.tenantId, createdAt: { gte: startDate } },
      _count: true
    })

    return NextResponse.json({
      success: true,
      handoffs,
      summary: statusSummary.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      count: handoffs.length
    })
  } catch (error) {
    console.error('Error fetching handoffs:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch handoffs' }, { status: 500 })
  }
}

// POST /api/handoffs - Create handoff
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    // Check for special actions
    if (body.action === 'issue_to_production') {
      const data = issueToProductionSchema.parse(body)
      const handoff = await issueToProduction(
        user.tenantId,
        data.moId,
        data.items,
        user.id,
        data.toWorkstationId
      )
      return NextResponse.json({
        success: true,
        handoff,
        message: 'Materials issued to production'
      })
    }
    
    if (body.action === 'move_to_ppic') {
      const data = moveToPPICSchema.parse(body)
      const handoff = await moveToPPICRack(
        user.tenantId,
        data.moId,
        data.items,
        user.id
      )
      return NextResponse.json({
        success: true,
        handoff,
        message: 'Materials moved to PPIC Rack'
      })
    }
    
    // Regular handoff creation
    const data = createHandoffSchema.parse(body)
    const handoff = await createMaterialHandoff(user.tenantId, {
      ...data,
      handedBy: user.id,
    })

    return NextResponse.json({
      success: true,
      handoff,
      message: 'Handoff created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating handoff:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create handoff' }, { status: 500 })
  }
}

// PUT /api/handoffs/[id]/confirm - Confirm handoff receipt
export async function confirmHandoff(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params
    const body = await request.json()
    const data = confirmReceiptSchema.parse(body)

    const handoff = await confirmHandoffReceipt(
      user.tenantId,
      id,
      user.id,
      data.notes
    )

    return NextResponse.json({
      success: true,
      handoff,
      message: 'Handoff confirmed successfully'
    })
  } catch (error) {
    console.error('Error confirming handoff:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Failed to confirm handoff' }, { status: 500 })
  }
}

// GET /api/handoffs/[id]/tracking - Get material tracking for MO
export async function getTracking(
  request: NextRequest,
  context: { params: Promise<{ moId: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { moId } = await context.params

    const tracking = await getMaterialTrackingSummary(user.tenantId, moId)

    return NextResponse.json({
      success: true,
      tracking
    })
  } catch (error) {
    console.error('Error fetching tracking:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch tracking' }, { status: 500 })
  }
}

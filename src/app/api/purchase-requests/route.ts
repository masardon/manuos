// Purchase Requests API - List and manage purchase requests
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { receiveGoods } from '@/lib/inventory/material-requirements'
import { syncPurchaseOrdersToOdoo } from '@/lib/integrations/odoo'
import { z } from 'zod'

const receiveSchema = z.object({
  receivedItems: z.array(z.object({
    prItemId: z.string(),
    receivedQty: z.number().min(0.01),
    location: z.string().optional(),
    batch: z.string().optional(),
  })).min(1),
})

// GET /api/purchase-requests - List all purchase requests
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const status = searchParams.get('status')
    const sourceMoId = searchParams.get('sourceMoId')

    const where: any = { tenantId: user.tenantId }
    if (status) where.status = status
    if (sourceMoId) where.sourceMoId = sourceMoId

    const purchaseRequests = await db.purchaseRequest.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            materialRequirement: {
              select: { partNumber: true, requiredQty: true }
            }
          }
        },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      purchaseRequests,
      count: purchaseRequests.length
    })
  } catch (error) {
    console.error('Error fetching purchase requests:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch purchase requests' }, { status: 500 })
  }
}

// POST /api/purchase-requests/[id]/receive - Receive goods (warehouse confirmation)
export async function receivePurchaseOrder(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params
    const body = await request.json()
    const data = receiveSchema.parse(body)

    // Get PR to check if it exists
    const pr = await db.purchaseRequest.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!pr) {
      return NextResponse.json({ error: 'Purchase Request not found' }, { status: 404 })
    }

    // Process goods receipt
    const result = await receiveGoods(
      user.tenantId,
      id,
      data.receivedItems,
      user.id
    )

    // Sync receipt confirmation to Odoo if PR is linked to Odoo
    if (result.prComplete && pr.odooPoId) {
      await syncPurchaseOrdersToOdoo(user.tenantId)
    }

    return NextResponse.json({
      success: true,
      ...result,
      message: 'Goods received successfully'
    })
  } catch (error) {
    console.error('Error receiving goods:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to receive goods' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEMO_TENANT_ID = 'tenant_ypti'

// POST /api/orders/[id]/mo - Create Manufacturing Order for an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Verify order exists
    const order = await db.order.findFirst({
      where: {
        id,
        tenantId: DEMO_TENANT_ID,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get the next MO number for this order
    const existingMos = await db.manufacturingOrder.findMany({
      where: {
        orderId: id,
        tenantId: DEMO_TENANT_ID,
      },
      orderBy: { moNumber: 'desc' },
      take: 1,
    })

    let nextMoNumber = body.moNumber
    if (!nextMoNumber) {
      const orderMos = await db.manufacturingOrder.findMany({
        where: {
          orderId: id,
          tenantId: DEMO_TENANT_ID,
        },
      })
      nextMoNumber = `MO-${String(orderMos.length + 1).padStart(3, '0')}`
    }

    // Create the Manufacturing Order
    const mo = await db.manufacturingOrder.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        orderId: id,
        moNumber: nextMoNumber,
        name: body.name || `Manufacturing Order ${nextMoNumber}`,
        description: body.description || null,
        isOutsourced: body.isOutsourced || false,
        outsourcedType: body.outsourcedType || null,
        vendorId: body.vendorId || null,
        recipeId: body.recipeId || null,
        status: 'DRAFT',
        plannedStartDate: body.plannedStartDate ? new Date(body.plannedStartDate) : null,
        plannedEndDate: body.plannedEndDate ? new Date(body.plannedEndDate) : null,
        progressPercent: 0,
      },
    })

    // If recipe is selected, create material requirements
    if (body.recipeId) {
      const recipe = await db.recipe.findUnique({
        where: { id: body.recipeId },
        include: { ingredients: true },
      })

      if (recipe) {
        // Create material requirements from recipe
        for (const ingredient of recipe.ingredients) {
          await db.materialRequirement.create({
            data: {
              tenantId: DEMO_TENANT_ID,
              moId: mo.id,
              partNumber: ingredient.partNumber,
              name: ingredient.name,
              requiredQuantity: ingredient.requiredQuantity,
              unit: ingredient.unit,
              status: 'PENDING',
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      mo,
      message: 'Manufacturing order created successfully',
    })
  } catch (error) {
    console.error('Error creating MO:', error)
    return NextResponse.json(
      { error: 'Failed to create manufacturing order' },
      { status: 500 }
    )
  }
}

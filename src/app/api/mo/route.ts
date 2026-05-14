import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEMO_TENANT_ID = 'tenant_ypti'

export async function GET(request: NextRequest) {
  try {
    const mos = await db.manufacturingOrder.findMany({
      where: { tenantId: DEMO_TENANT_ID },
      include: {
        order: {
          select: { orderNumber: true, customerName: true }
        },
        vendor: {
          select: { name: true, code: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ mos })
  } catch (error) {
    console.error('Error fetching MOs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manufacturing orders' },
      { status: 500 }
    )
  }
}

// POST /api/mo - Create Manufacturing Order (standalone)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify order exists
    const order = await db.order.findFirst({
      where: {
        id: body.orderId,
        tenantId: DEMO_TENANT_ID,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get the next MO number
    const existingMos = await db.manufacturingOrder.findMany({
      where: {
        orderId: body.orderId,
        tenantId: DEMO_TENANT_ID,
      },
      orderBy: { moNumber: 'desc' },
    })

    let nextMoNumber = body.moNumber
    if (!nextMoNumber) {
      nextMoNumber = `MO-${String(existingMos.length + 1).padStart(3, '0')}`
    }

    // Create the Manufacturing Order
    const mo = await db.manufacturingOrder.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        orderId: body.orderId,
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
      include: {
        order: {
          select: { orderNumber: true, customerName: true }
        },
      },
    })

    // If recipe is selected, create material requirements
    if (body.recipeId) {
      const recipe = await db.recipe.findUnique({
        where: { id: body.recipeId },
        include: { ingredients: true },
      })

      if (recipe) {
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
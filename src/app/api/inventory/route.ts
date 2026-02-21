import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId') || 'tenant_ypti'

    const inventory = await db.inventory.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        partNumber: 'asc',
      },
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ inventory: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partNumber, name, description, category, batch, quantity, unit, location, tenantId } = body

    if (!partNumber || !name) {
      return NextResponse.json(
        { error: 'Part number and name are required' },
        { status: 400 }
      )
    }

    const inventory = await db.inventory.create({
      data: {
        tenantId: tenantId || 'tenant_default',
        partNumber,
        name,
        description,
        category,
        batch,
        quantity: quantity || 0,
        unit,
        location,
        status: 'AVAILABLE',
      },
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

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
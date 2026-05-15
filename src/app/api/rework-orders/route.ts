import { NextRequest, NextResponse } from 'next/server'
import {
  getReworkOrders,
  createReworkOrder,
} from '@/lib/inventory/quality-control'

const DEMO_TENANT_ID = 'tenant_ypti'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const reworkType = searchParams.get('reworkType') || undefined
    const assignedToId = searchParams.get('assignedToId') || undefined
    
    const reworkOrders = await getReworkOrders(DEMO_TENANT_ID, {
      status: status || undefined,
      reworkType: reworkType || undefined,
      assignedToId: assignedToId || undefined,
    })
    
    return NextResponse.json({ reworkOrders })
  } catch (error) {
    console.error('Error fetching rework orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rework orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const reworkOrder = await createReworkOrder({
      tenantId: DEMO_TENANT_ID,
      qualityCheckId: body.qualityCheckId,
      reworkType: body.reworkType,
      priority: body.priority,
      defectDescription: body.defectDescription,
      rootCause: body.rootCause,
      instructions: body.instructions,
      estimatedCost: body.estimatedCost,
      estimatedHours: body.estimatedHours,
      assignedToId: body.assignedToId,
      notes: body.notes,
    })
    
    return NextResponse.json({ reworkOrder }, { status: 201 })
  } catch (error) {
    console.error('Error creating rework order:', error)
    return NextResponse.json(
      { error: 'Failed to create rework order' },
      { status: 500 }
    )
  }
}
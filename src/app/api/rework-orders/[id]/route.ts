import { NextRequest, NextResponse } from 'next/server'
import {
  getReworkOrderById,
  startRework,
  completeRework,
  failRework,
  cancelRework,
} from '@/lib/inventory/quality-control'

const DEMO_TENANT_ID = 'tenant_ypti'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reworkOrder = await getReworkOrderById(DEMO_TENANT_ID, id)
    
    if (!reworkOrder) {
      return NextResponse.json(
        { error: 'Rework order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ reworkOrder })
  } catch (error) {
    console.error('Error fetching rework order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rework order' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const action = body.action
    
    if (action === 'start') {
      const result = await startRework(id, DEMO_TENANT_ID, body.assignedToId)
      return NextResponse.json({ reworkOrder: result })
    }
    
    if (action === 'complete') {
      const result = await completeRework(id, DEMO_TENANT_ID, {
        resultQuantity: body.resultQuantity,
        scrapQuantity: body.scrapQuantity,
        resultNotes: body.resultNotes,
        requiresReinspection: body.requiresReinspection,
      })
      return NextResponse.json({ reworkOrder: result })
    }
    
    if (action === 'fail') {
      const result = await failRework(id, DEMO_TENANT_ID, body.notes)
      return NextResponse.json({ reworkOrder: result })
    }
    
    if (action === 'cancel') {
      const result = await cancelRework(id, DEMO_TENANT_ID, body.notes)
      return NextResponse.json({ reworkOrder: result })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating rework order:', error)
    return NextResponse.json(
      { error: 'Failed to update rework order' },
      { status: 500 }
    )
  }
}
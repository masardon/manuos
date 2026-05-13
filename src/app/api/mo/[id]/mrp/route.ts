import { NextRequest, NextResponse } from 'next/server'
import { 
  calculateMaterialRequirements, 
  executeFullMRPWorkflow,
  autoGenerateMaterialRequirements,
  autoReserveFromStock
} from '@/lib/inventory/mrp'

const DEMO_TENANT_ID = 'tenant_ypti'

// POST /api/mo/[moId]/mrp - Execute MRP workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moId } = await params
    const body = await request.json()
    const action = body.action || 'calculate'

    if (action === 'calculate') {
      const result = await calculateMaterialRequirements(DEMO_TENANT_ID, moId)
      return NextResponse.json({ success: true, ...result })
    }

    if (action === 'generate') {
      const result = await autoGenerateMaterialRequirements(DEMO_TENANT_ID, moId, 'system')
      return NextResponse.json({ success: true, ...result })
    }

    if (action === 'reserve') {
      const result = await autoReserveFromStock(DEMO_TENANT_ID, moId, 'system')
      return NextResponse.json({ success: true, ...result })
    }

    if (action === 'full-mrp') {
      const result = await executeFullMRPWorkflow(DEMO_TENANT_ID, moId, 'system')
      return NextResponse.json({ success: true, ...result })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: calculate, generate, reserve, or full-mrp' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('MRP error:', error)
    return NextResponse.json(
      { error: error.message || 'MRP calculation failed' },
      { status: 500 }
    )
  }
}

// GET /api/mo/[moId]/mrp - Calculate MRP without saving
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moId } = await params
    const result = await calculateMaterialRequirements(DEMO_TENANT_ID, moId)
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('MRP calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'MRP calculation failed' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { 
  distributeMaterialsToJobsheet,
  allocateMaterialToTask,
  consumeMaterialAtTask,
  getJobsheetMaterialsSummary,
  autoDistributeMaterialsToJobsheets
} from '@/lib/inventory/material-allocation'

const DEMO_TENANT_ID = 'tenant_ypti'

// GET /api/jobsheet/[id]/materials - Get jobsheet materials
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getJobsheetMaterialsSummary(DEMO_TENANT_ID, id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching jobsheet materials:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobsheet materials' },
      { status: 500 }
    )
  }
}

// POST /api/jobsheet/[id]/materials - Distribute materials to jobsheet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const action = body.action

    if (action === 'auto-distribute') {
      const result = await autoDistributeMaterialsToJobsheets(
        DEMO_TENANT_ID,
        body.moId,
        body.distributedBy || 'system'
      )
      return NextResponse.json({ success: true, ...result })
    }

    if (action === 'allocate-to-task') {
      const result = await allocateMaterialToTask({
        tenantId: DEMO_TENANT_ID,
        jobsheetMaterialId: body.jobsheetMaterialId,
        taskId: body.taskId,
        quantity: body.quantity,
      })
      return NextResponse.json({ success: true, allocation: result })
    }

    if (action === 'consume') {
      const result = await consumeMaterialAtTask({
        tenantId: DEMO_TENANT_ID,
        taskMaterialAllocationId: body.taskMaterialAllocationId,
        consumedQty: body.consumedQty,
        wastedQty: body.wastedQty,
        wasteReason: body.wasteReason,
        consumedBy: body.consumedBy || 'system',
      })
      return NextResponse.json({ success: true, allocation: result })
    }

    // Default: manual distribution
    const result = await distributeMaterialsToJobsheet({
      tenantId: DEMO_TENANT_ID,
      jobsheetId: id,
      allocations: body.allocations,
      distributedBy: body.distributedBy || 'system',
    })
    return NextResponse.json({ success: true, allocations: result }, { status: 201 })
  } catch (error: any) {
    console.error('Error distributing materials:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to distribute materials' },
      { status: 500 }
    )
  }
}
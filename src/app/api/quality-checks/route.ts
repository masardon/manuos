import { NextRequest, NextResponse } from 'next/server'
import {
  getQualityChecks,
  createQualityCheck,
  getQCStats,
  getDefectSummary,
} from '@/lib/inventory/quality-control'

const DEMO_TENANT_ID = 'tenant_ypti'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const checkType = searchParams.get('checkType') || undefined
    const orderId = searchParams.get('orderId') || undefined
    const moId = searchParams.get('moId') || undefined
    const stats = searchParams.get('stats') === 'true'
    const defects = searchParams.get('defects') === 'true'
    
    if (stats) {
      const qcStats = await getQCStats(DEMO_TENANT_ID)
      return NextResponse.json({ stats: qcStats })
    }
    
    if (defects) {
      const fromDate = searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined
      const defectSummary = await getDefectSummary(DEMO_TENANT_ID, fromDate)
      return NextResponse.json({ defects: defectSummary })
    }
    
    const qualityChecks = await getQualityChecks(DEMO_TENANT_ID, {
      status: status || undefined,
      checkType: checkType || undefined,
      orderId: orderId || undefined,
      moId: moId || undefined,
    })
    
    return NextResponse.json({ qualityChecks })
  } catch (error) {
    console.error('Error fetching quality checks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality checks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const qualityCheck = await createQualityCheck({
      tenantId: DEMO_TENANT_ID,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      orderId: body.orderId,
      moId: body.moId,
      inventoryId: body.inventoryId,
      handoffId: body.handoffId,
      checkType: body.checkType,
      inspectionStage: body.inspectionStage,
      partNumber: body.partNumber,
      productName: body.productName,
      batch: body.batch,
      quantity: body.quantity,
      unit: body.unit,
      inspectorId: body.inspectorId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      customerApprovalRequired: body.customerApprovalRequired,
      notes: body.notes,
      checkItems: body.checkItems,
    })
    
    return NextResponse.json({ qualityCheck }, { status: 201 })
  } catch (error) {
    console.error('Error creating quality check:', error)
    return NextResponse.json(
      { error: 'Failed to create quality check' },
      { status: 500 }
    )
  }
}
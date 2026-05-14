import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleQCInspectionAndUpdateInventory } from '@/lib/inventory/inventory-ledger'

const DEMO_TENANT_ID = 'tenant_ypti'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/production-output/[id]/qc - Complete QC inspection with inventory update
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      qcPassed,
      goodQty,
      reworkQty,
      scrapQty,
      defectNotes,
    } = body

    // Get current output
    const output = await db.productionOutput.findFirst({
      where: { id, tenantId: DEMO_TENANT_ID },
    })

    if (!output) {
      return NextResponse.json(
        { error: 'Production output not found' },
        { status: 404 }
      )
    }

    // Calculate actual quantities (use provided or existing)
    const actualGoodQty = goodQty !== undefined ? goodQty : output.goodQty
    const actualReworkQty = reworkQty !== undefined ? reworkQty : output.reworkQty
    const actualScrapQty = scrapQty !== undefined ? scrapQty : output.scrapQty

    // Handle QC inspection using inventory ledger (atomic)
    const qcResult = await handleQCInspectionAndUpdateInventory({
      tenantId: DEMO_TENANT_ID,
      qualityCheckId: id,  // Using output ID as QC reference
      productionOutputId: id,
      result: qcPassed ? 'PASS' : 'FAIL',
      goodQty: actualGoodQty,
      reworkQty: actualReworkQty,
      scrapQty: actualScrapQty,
      inspectorId: 'system',
      outputLocationId: output.outputLocationId || undefined,
    })

    // Update output with QC results
    const newStatus = qcPassed 
      ? (actualGoodQty > 0 ? 'STORED' : 'QC_PASSED') 
      : 'QC_FAILED'
    
    await db.productionOutput.update({
      where: { id },
      data: {
        status: newStatus,
        qcPassed,
        goodQty: actualGoodQty,
        reworkQty: actualReworkQty,
        scrapQty: actualScrapQty,
        qcCheckedAt: new Date(),
        qcCheckedBy: 'system',
        qcNotes: defectNotes,
        defectNotes,
      },
    })

    // Create QualityCheck record for audit trail
    const qcNumber = `QC-${new Date().getFullYear()}-${String(Date.now()).slice(-3).padStart(3, '0')}`
    await db.qualityCheck.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        qcNumber,
        referenceType: 'PRODUCTION_OUTPUT',
        referenceId: id,
        checkType: 'FINAL',
        status: qcPassed ? 'PASSED' : 'FAILED',
        result: qcPassed ? 'PASS' : 'FAIL',
        inspectorId: 'system',
        notes: defectNotes,
      }
    })

    return NextResponse.json({
      success: true,
      qcPassed,
      output: {
        id,
        status: newStatus,
        goodQty: actualGoodQty,
        reworkQty: actualReworkQty,
        scrapQty: actualScrapQty,
      },
      reworkOrder: qcResult?.reworkOrder ? {
        id: qcResult.reworkOrder.id,
        reworkNumber: qcResult.reworkOrder.reworkNumber,
      } : null,
      message: qcPassed 
        ? 'QC passed - items stored as finished goods in inventory' 
        : `QC failed - ${actualReworkQty > 0 ? 'rework order created, ' : ''}items moved to ${actualReworkQty > 0 ? 'rework inventory' : 'scrap'}`,
    })
  } catch (error: any) {
    console.error('Error completing QC:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete QC' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recordProductionOutputToInventory } from '@/lib/inventory/inventory-ledger'

const DEMO_TENANT_ID = 'tenant_ypti'

// POST /api/production-output - Create production output record with inventory update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      taskId,
      jobsheetId,
      moId,
      partNumber,
      productName,
      plannedQty,
      actualQty,
      goodQty,
      reworkQty,
      scrapQty,
      batch,
      outputLocationId,
      notes,
    } = body

    // Validate required fields
    if (!taskId || !jobsheetId || !moId || !partNumber || !actualQty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get MO to get orderId
    const mo = await db.manufacturingOrder.findFirst({
      where: { id: moId, tenantId: DEMO_TENANT_ID },
      select: { orderId: true }
    })

    if (!mo) {
      return NextResponse.json(
        { error: 'Manufacturing Order not found' },
        { status: 404 }
      )
    }

    // Generate output number
    const year = new Date().getFullYear()
    const prefix = `PO-${year}-`
    const lastOutput = await db.productionOutput.findFirst({
      where: { tenantId: DEMO_TENANT_ID, outputNumber: { startsWith: prefix } },
      orderBy: { outputNumber: 'desc' },
    })
    const sequence = lastOutput ? parseInt(lastOutput.outputNumber.replace(prefix, ''), 10) + 1 : 1
    const outputNumber = `${prefix}${sequence.toString().padStart(3, '0')}`

    // Create production output using inventory ledger (atomic operation)
    const result = await recordProductionOutputToInventory({
      tenantId: DEMO_TENANT_ID,
      productionOutputId: '',  // Will be set after output is created
      partNumber,
      productName,
      goodQuantity: goodQty || actualQty,
      reworkQuantity: reworkQty || 0,
      scrapQuantity: scrapQty || 0,
      locationId: outputLocationId || '',
      shelfId: undefined,
      batch,
      moId,
      orderId: mo.orderId,
      performedBy: 'system',
    })

    // Create production output record (after inventory update)
    const output = await db.productionOutput.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        outputNumber,
        taskId,
        jobsheetId,
        moId,
        orderId: mo.orderId,
        partNumber,
        productName,
        plannedQty: plannedQty || 1,
        actualQty,
        goodQty: goodQty || actualQty,
        reworkQty: reworkQty || 0,
        scrapQty: scrapQty || 0,
        batch: batch || null,
        outputLocationId: outputLocationId || null,
        status: (reworkQty || 0) > 0 ? 'PENDING_QC' : 'QC_PASSED',
        notes,
        createdBy: 'system',
      },
    })

    // Update task status to COMPLETED
    await db.machiningTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        clockedOutAt: new Date(),
        progressPercent: 100,
      },
    })

    // Update task progress in jobsheet
    const tasksInJobsheet = await db.machiningTask.findMany({
      where: { jobsheetId },
      select: { status: true },
    })
    
    const completedTasks = tasksInJobsheet.filter(t => t.status === 'COMPLETED').length
    const jobsheetProgress = (completedTasks / tasksInJobsheet.length) * 100
    
    await db.jobsheet.update({
      where: { id: jobsheetId },
      data: { progressPercent: jobsheetProgress }
    })

    return NextResponse.json({
      success: true,
      output: {
        id: output.id,
        outputNumber: output.outputNumber,
        status: output.status,
        goodQty: output.goodQty,
        reworkQty: output.reworkQty,
        scrapQty: output.scrapQty,
      },
      inventory: {
        goodInventory: result.goodInventory ? {
          id: result.goodInventory.id,
          partNumber: result.goodInventory.partNumber,
          quantity: result.goodInventory.currentQuantity,
        } : null,
        reworkInventory: result.reworkInventory ? {
          id: result.reworkInventory.id,
          quantity: result.reworkInventory.currentQuantity,
        } : null,
      },
      message: 'Production output recorded and inventory updated',
    })
  } catch (error: any) {
    console.error('Error creating production output:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create production output' },
      { status: 500 }
    )
  }
}

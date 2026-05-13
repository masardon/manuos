// Quality Control Service for ManuOS
// Handles QC inspections, defect tracking, and rework management

import { db } from '@/lib/db'

// ============================================
// QC Number Generation
// ============================================

export async function generateQCNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `QC-${year}-`
  
  const lastQC = await db.qualityCheck.findFirst({
    where: {
      tenantId,
      qcNumber: { startsWith: prefix },
    },
    orderBy: { qcNumber: 'desc' },
  })
  
  let sequence = 1
  if (lastQC) {
    const lastSeq = parseInt(lastQC.qcNumber.replace(prefix, ''), 10)
    sequence = lastSeq + 1
  }
  
  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

export async function generateReworkNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `RW-${year}-`
  
  const lastRework = await db.reworkOrder.findFirst({
    where: {
      tenantId,
      reworkNumber: { startsWith: prefix },
    },
    orderBy: { reworkNumber: 'desc' },
  })
  
  let sequence = 1
  if (lastRework) {
    const lastSeq = parseInt(lastRework.reworkNumber.replace(prefix, ''), 10)
    sequence = lastSeq + 1
  }
  
  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

// ============================================
// Quality Check CRUD
// ============================================

export interface CreateQualityCheckInput {
  tenantId: string
  referenceType: string  // ORDER, MO, INVENTORY, HANDOFF
  referenceId: string
  orderId?: string
  moId?: string
  inventoryId?: string
  handoffId?: string
  checkType: string  // INCOMING, IN_PROCESS, FINAL, CUSTOMER
  inspectionStage: string
  partNumber: string
  productName: string
  batch?: string
  quantity: number
  unit?: string
  inspectorId?: string
  dueDate?: Date
  customerApprovalRequired?: boolean
  notes?: string
  checkItems?: CreateQualityCheckItemInput[]
}

export interface CreateQualityCheckItemInput {
  criteriaCode: string
  criteriaName: string
  description?: string
  category: string
  checkMethod?: string
  specification?: string
  minValue?: number
  maxValue?: number
  targetValue?: number
  unit?: string
  order?: number
}

export async function createQualityCheck(input: CreateQualityCheckInput) {
  const qcNumber = await generateQCNumber(input.tenantId)
  
  const qualityCheck = await db.qualityCheck.create({
    data: {
      tenantId: input.tenantId,
      qcNumber,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      orderId: input.orderId,
      moId: input.moId,
      inventoryId: input.inventoryId,
      handoffId: input.handoffId,
      checkType: input.checkType as any,
      inspectionStage: input.inspectionStage,
      partNumber: input.partNumber,
      productName: input.productName,
      batch: input.batch,
      quantity: input.quantity,
      unit: input.unit,
      inspectorId: input.inspectorId,
      dueDate: input.dueDate,
      customerApprovalRequired: input.customerApprovalRequired || false,
      notes: input.notes,
      checkItems: input.checkItems ? {
        create: input.checkItems.map((item, index) => ({
          tenantId: input.tenantId,
          criteriaCode: item.criteriaCode,
          criteriaName: item.criteriaName,
          description: item.description,
          category: item.category,
          checkMethod: item.checkMethod,
          specification: item.specification,
          minValue: item.minValue,
          maxValue: item.maxValue,
          targetValue: item.targetValue,
          unit: item.unit,
          order: item.order ?? index,
        })),
      } : undefined,
    },
    include: {
      checkItems: true,
      order: true,
      manufacturingOrder: true,
      inspector: true,
    },
  })
  
  return qualityCheck
}

export async function getQualityChecks(
  tenantId: string,
  filters?: {
    status?: string
    checkType?: string
    orderId?: string
    moId?: string
    from?: Date
    to?: Date
  }
) {
  const where: any = { tenantId }
  
  if (filters?.status) where.status = filters.status
  if (filters?.checkType) where.checkType = filters.checkType
  if (filters?.orderId) where.orderId = filters.orderId
  if (filters?.moId) where.moId = filters.moId
  if (filters?.from || filters?.to) {
    where.createdAt = {}
    if (filters.from) where.createdAt.gte = filters.from
    if (filters.to) where.createdAt.lte = filters.to
  }
  
  return db.qualityCheck.findMany({
    where,
    include: {
      order: { select: { orderNumber: true, customerName: true } },
      manufacturingOrder: { select: { moNumber: true } },
      inspector: { select: { name: true, email: true } },
      checkItems: true,
      reworkOrder: { select: { reworkNumber: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getQualityCheckById(tenantId: string, id: string) {
  return db.qualityCheck.findFirst({
    where: { id, tenantId },
    include: {
      order: true,
      manufacturingOrder: true,
      inventory: true,
      handoff: true,
      inspector: { select: { name: true, email: true, employeeId: true } },
      checkItems: { orderBy: { order: 'asc' } },
      reworkOrder: {
        include: {
          assignedTo: { select: { name: true, email: true } },
          items: true,
          tasks: { orderBy: { sequence: 'asc' } },
        },
      },
    },
  })
}

// ============================================
// QC Result Recording
// ============================================

export interface RecordQCResultInput {
  qualityCheckId: string
  tenantId: string
  results: {
    itemId: string
    result: 'PASS' | 'FAIL' | 'NA'
    actualValue?: number
    actualText?: string
    defectCode?: string
    defectSeverity?: string
    defectNotes?: string
  }[]
  overallStatus: 'PASSED' | 'FAILED' | 'REWORK'
  passQuantity: number
  failQuantity: number
  reworkQuantity?: number
  scrapQuantity?: number
  defectCode?: string
  defectDescription?: string
  defectCategory?: string
  notes?: string
}

export async function recordQCResult(input: RecordQCResultInput) {
  const { qualityCheckId, tenantId, results, overallStatus, ...data } = input
  
  // Update individual check items
  for (const result of results) {
    await db.qualityCheckItem.update({
      where: { id: result.itemId },
      data: {
        result: result.result as any,
        actualValue: result.actualValue,
        actualText: result.actualText,
        defectCode: result.defectCode,
        defectSeverity: result.defectSeverity,
        defectNotes: result.defectNotes,
      },
    })
  }
  
  // Update overall QC record
  const qc = await db.qualityCheck.update({
    where: { id: qualityCheckId },
    data: {
      status: overallStatus === 'PASSED' ? 'PASSED' : overallStatus === 'FAILED' ? 'FAILED' : 'REWORK',
      passQuantity: data.passQuantity,
      failQuantity: data.failQuantity,
      reworkQuantity: data.reworkQuantity || 0,
      scrapQuantity: data.scrapQuantity || 0,
      defectCode: data.defectCode,
      defectDescription: data.defectDescription,
      defectCategory: data.defectCategory,
      notes: data.notes,
      completedAt: new Date(),
      // If customer approval required, set to pending approval
      ...(input.overallStatus === 'PASSED' && {
        customerApproved: false, // Will be set when customer approves
      }),
    },
    include: {
      checkItems: true,
      order: true,
      manufacturingOrder: true,
    },
  })
  
  // If status is FAILED or REWORK, automatically create a ReworkOrder
  if (overallStatus === 'FAILED' || overallStatus === 'REWORK') {
    await createReworkFromQC(qc)
  }
  
  // Update inventory status if this is a FINAL QC
  if (qc.checkType === 'FINAL' && overallStatus === 'PASSED' && qc.inventoryId) {
    await db.inventory.update({
      where: { id: qc.inventoryId },
      data: {
        status: 'AVAILABLE',
        currentProcess: 'READY_TO_SHIP',
      },
    })
  }
  
  return qc
}

// ============================================
// Rework Order Management
// ============================================

export interface CreateReworkOrderInput {
  tenantId: string
  qualityCheckId: string
  reworkType: string
  priority?: string
  defectDescription: string
  rootCause?: string
  instructions?: string
  estimatedCost?: number
  estimatedHours?: number
  assignedToId?: string
  notes?: string
}

async function createReworkFromQC(qc: any) {
  const reworkNumber = await generateReworkNumber(qc.tenantId)
  
  // Create rework order
  const reworkOrder = await db.reworkOrder.create({
    data: {
      tenantId: qc.tenantId,
      reworkNumber,
      qualityCheckId: qc.id,
      orderId: qc.orderId,
      moId: qc.moId,
      inventoryId: qc.inventoryId,
      reworkType: qc.reworkQuantity > 0 ? 'REPROCESS' : 'REPAIR',
      priority: qc.failQuantity > 0 ? 'HIGH' : 'MEDIUM',
      partNumber: qc.partNumber,
      productName: qc.productName,
      batch: qc.batch,
      quantity: qc.reworkQuantity || qc.failQuantity,
      unit: qc.unit,
      defectCode: qc.defectCode,
      defectDescription: qc.defectDescription || 'Failed QC inspection',
      status: 'PENDING',
    },
  })
  
  // Update QC record with rework order reference
  await db.qualityCheck.update({
    where: { id: qc.id },
    data: {
      reworkRequired: true,
    },
  })
  
  return reworkOrder
}

export async function createReworkOrder(input: CreateReworkOrderInput) {
  const reworkNumber = await generateReworkNumber(input.tenantId)
  
  // Get QC details
  const qc = await db.qualityCheck.findFirst({
    where: { id: input.qualityCheckId, tenantId: input.tenantId },
  })
  
  if (!qc) {
    throw new Error('Quality check not found')
  }
  
  const reworkOrder = await db.reworkOrder.create({
    data: {
      tenantId: input.tenantId,
      reworkNumber,
      qualityCheckId: input.qualityCheckId,
      orderId: qc.orderId,
      moId: qc.moId,
      inventoryId: qc.inventoryId,
      reworkType: input.reworkType as any,
      priority: input.priority || 'MEDIUM',
      partNumber: qc.partNumber,
      productName: qc.productName,
      batch: qc.batch,
      quantity: qc.failQuantity + qc.reworkQuantity,
      unit: qc.unit,
      defectCode: qc.defectCode,
      defectDescription: input.defectDescription,
      rootCause: input.rootCause,
      instructions: input.instructions,
      estimatedCost: input.estimatedCost,
      estimatedHours: input.estimatedHours,
      assignedToId: input.assignedToId,
      notes: input.notes,
      status: 'PENDING',
    },
    include: {
      qualityCheck: true,
      assignedTo: { select: { name: true, email: true } },
    },
  })
  
  // Update QC status
  await db.qualityCheck.update({
    where: { id: input.qualityCheckId },
    data: {
      reworkRequired: true,
      status: 'REWORK',
    },
  })
  
  return reworkOrder
}

export async function getReworkOrders(
  tenantId: string,
  filters?: {
    status?: string
    reworkType?: string
    assignedToId?: string
  }
) {
  const where: any = { tenantId }
  
  if (filters?.status) where.status = filters.status
  if (filters?.reworkType) where.reworkType = filters.reworkType
  if (filters?.assignedToId) where.assignedToId = filters.assignedToId
  
  return db.reworkOrder.findMany({
    where,
    include: {
      qualityCheck: { select: { qcNumber: true, status: true } },
      order: { select: { orderNumber: true, customerName: true } },
      manufacturingOrder: { select: { moNumber: true } },
      assignedTo: { select: { name: true, email: true } },
      items: true,
      tasks: { orderBy: { sequence: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getReworkOrderById(tenantId: string, id: string) {
  return db.reworkOrder.findFirst({
    where: { id, tenantId },
    include: {
      qualityCheck: {
        include: {
          checkItems: true,
        },
      },
      order: true,
      manufacturingOrder: true,
      inventory: true,
      assignedTo: { select: { name: true, email: true, employeeId: true } },
      items: {
        include: {
          inventory: { select: { batch: true, shelf: true, location: true } },
        },
      },
      tasks: {
        orderBy: { sequence: 'asc' },
        include: {
          machine: { select: { code: true, name: true } },
          assignedTo: { select: { name: true } },
        },
      },
    },
  })
}

// ============================================
// Rework Status Updates
// ============================================

export async function startRework(reworkOrderId: string, tenantId: string, assignedToId?: string) {
  return db.reworkOrder.update({
    where: { id: reworkOrderId },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      assignedToId: assignedToId || undefined,
      assignedAt: assignedToId ? new Date() : undefined,
    },
  })
}

export async function completeRework(
  reworkOrderId: string,
  tenantId: string,
  result: {
    resultQuantity: number
    scrapQuantity?: number
    resultNotes?: string
    requiresReinspection?: boolean
  }
) {
  const reworkOrder = await db.reworkOrder.update({
    where: { id: reworkOrderId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completionPercentage: 100,
      resultQuantity: result.resultQuantity,
      scrapQuantity: result.scrapQuantity || 0,
      resultNotes: result.resultNotes,
      requiresReinspection: result.requiresReinspection !== false,
    },
    include: {
      qualityCheck: true,
      inventory: true,
    },
  })
  
  // If rework is complete and inventory exists, update inventory status
  if (reworkOrder.inventory) {
    await db.inventory.update({
      where: { id: reworkOrder.inventoryId! },
      data: {
        status: 'AVAILABLE',
        currentProcess: 'READY_FOR_QC',
      },
    })
  }
  
  // If reinspection required, create a new QC record
  if (result.requiresReinspection !== false) {
    await createQualityCheck({
      tenantId,
      referenceType: 'REWORK',
      referenceId: reworkOrderId,
      orderId: reworkOrder.orderId || undefined,
      moId: reworkOrder.moId || undefined,
      inventoryId: reworkOrder.inventoryId || undefined,
      checkType: 'IN_PROCESS',
      inspectionStage: 'POST_REWORK',
      partNumber: reworkOrder.partNumber,
      productName: reworkOrder.productName,
      batch: reworkOrder.batch || undefined,
      quantity: result.resultQuantity,
      unit: reworkOrder.unit || undefined,
      notes: `Re-inspection for rework ${reworkOrder.reworkNumber}`,
    })
  }
  
  return reworkOrder
}

export async function failRework(reworkOrderId: string, tenantId: string, notes?: string) {
  return db.reworkOrder.update({
    where: { id: reworkOrderId },
    data: {
      status: 'FAILED',
      notes: notes,
    },
  })
}

export async function cancelRework(reworkOrderId: string, tenantId: string, notes?: string) {
  const reworkOrder = await db.reworkOrder.update({
    where: { id: reworkOrderId },
    data: {
      status: 'CANCELLED',
      notes: notes,
    },
    include: {
      qualityCheck: true,
    },
  })
  
  // Reset QC status if rework is cancelled
  if (reworkOrder.qualityCheck) {
    await db.qualityCheck.update({
      where: { id: reworkOrder.qualityCheckId },
      data: {
        status: 'FAILED',
        reworkRequired: false,
      },
    })
  }
  
  return reworkOrder
}

// ============================================
// Customer Approval
// ============================================

export async function approveByCustomer(
  qualityCheckId: string,
  tenantId: string,
  approvedBy: string
) {
  return db.qualityCheck.update({
    where: { id: qualityCheckId },
    data: {
      customerApproved: true,
      customerApprovedAt: new Date(),
      customerApprovedBy: approvedBy,
    },
  })
}

export async function rejectByCustomer(
  qualityCheckId: string,
  tenantId: string,
  reason?: string
) {
  const qc = await db.qualityCheck.update({
    where: { id: qualityCheckId },
    data: {
      status: 'FAILED',
      notes: reason ? `Customer rejected: ${reason}` : 'Customer rejected',
    },
  })
  
  // Create rework order for customer rejection
  if (qc.failQuantity > 0 || qc.reworkQuantity > 0) {
    await createReworkOrder({
      tenantId,
      qualityCheckId,
      reworkType: 'REWORK',
      priority: 'URGENT',
      defectDescription: reason || 'Customer rejection',
      instructions: 'Requires rework per customer feedback',
    })
  }
  
  return qc
}

// ============================================
// Statistics
// ============================================

export async function getQCStats(tenantId: string) {
  const [total, pending, passed, failed, inRework] = await Promise.all([
    db.qualityCheck.count({ where: { tenantId } }),
    db.qualityCheck.count({ where: { tenantId, status: 'PENDING' } }),
    db.qualityCheck.count({ where: { tenantId, status: 'PASSED' } }),
    db.qualityCheck.count({ where: { tenantId, status: 'FAILED' } }),
    db.qualityCheck.count({ where: { tenantId, status: 'REWORK' } }),
  ])
  
  const passRate = total > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : '0.0'
  
  const pendingReworks = await db.reworkOrder.count({
    where: { tenantId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
  })
  
  return {
    total,
    pending,
    passed,
    failed,
    inRework,
    passRate: parseFloat(passRate),
    pendingReworks,
  }
}

export async function getDefectSummary(tenantId: string, fromDate?: Date) {
  const where: any = {
    tenantId,
    status: { in: ['FAILED', 'REWORK'] },
    defectCode: { not: null },
  }
  
  if (fromDate) {
    where.createdAt = { gte: fromDate }
  }
  
  const defects = await db.qualityCheck.groupBy({
    by: ['defectCode', 'defectCategory'],
    where,
    _count: { id: true },
    _sum: { failQuantity: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20,
  })
  
  return defects
}
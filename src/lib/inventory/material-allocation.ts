// Material Allocation Service for ManuOS
// Distributes materials from MO to Jobsheets and Tasks

import { db } from '@/lib/db'

// ============================================
// Distribute Materials to Jobsheet
// ============================================

export interface DistributeToJobsheetInput {
  tenantId: string
  jobsheetId: string
  allocations: {
    materialRequirementId: string
    quantity: number
    sourceBatch?: string
    sourceShelf?: string
    sourceLocation?: string
  }[]
  distributedBy: string
}

export async function distributeMaterialsToJobsheet(input: DistributeToJobsheetInput) {
  const { tenantId, jobsheetId, allocations, distributedBy } = input

  // Get jobsheet with MO
  const jobsheet = await db.jobsheet.findFirst({
    where: { id: jobsheetId, tenantId },
    include: { manufacturingOrder: true }
  })

  if (!jobsheet) {
    throw new Error('Jobsheet not found')
  }

  const results = []

  for (const alloc of allocations) {
    // Get material requirement
    const materialReq = await db.materialRequirement.findFirst({
      where: { id: alloc.materialRequirementId, tenantId, moId: jobsheet.moId }
    })

    if (!materialReq) {
      throw new Error(`Material requirement not found: ${alloc.materialRequirementId}`)
    }

    // Check available quantity (reserved but not yet distributed)
    const existingAllocations = await db.jobsheetMaterial.aggregate({
      where: {
        tenantId,
        materialRequirementId: alloc.materialRequirementId,
        status: { in: ['ALLOCATED', 'IN_USE'] }
      },
      _sum: { allocatedQty: true }
    })

    const alreadyAllocated = existingAllocations._sum.allocatedQty || 0
    const available = materialReq.reservedQty - alreadyAllocated

    if (alloc.quantity > available) {
      throw new Error(`Insufficient available quantity for ${materialReq.name}. Available: ${available}, Requested: ${alloc.quantity}`)
    }

    // Create jobsheet material allocation
    const jobsheetMaterial = await db.jobsheetMaterial.create({
      data: {
        tenantId,
        jobsheetId,
        materialRequirementId: alloc.materialRequirementId,
        partNumber: materialReq.partNumber,
        name: materialReq.name,
        allocatedQty: alloc.quantity,
        availableQty: alloc.quantity,
        unit: materialReq.unit,
        sourceBatch: alloc.sourceBatch,
        sourceShelf: alloc.sourceShelf,
        sourceLocation: alloc.sourceLocation,
        status: 'ALLOCATED',
        allocatedBy: distributedBy,
      },
      include: {
        materialRequirement: true,
      }
    })

    results.push(jobsheetMaterial)
  }

  // Update jobsheet status
  await db.jobsheet.update({
    where: { id: jobsheetId },
    data: { status: 'READY' }
  })

  return results
}

// ============================================
// Allocate Material to Task
// ============================================

export interface AllocateToTaskInput {
  tenantId: string
  jobsheetMaterialId: string
  taskId: string
  quantity: number
}

export async function allocateMaterialToTask(input: AllocateToTaskInput) {
  const { tenantId, jobsheetMaterialId, taskId, quantity } = input

  // Get jobsheet material
  const jobsheetMaterial = await db.jobsheetMaterial.findFirst({
    where: { id: jobsheetMaterialId, tenantId },
    include: { jobsheet: true }
  })

  if (!jobsheetMaterial) {
    throw new Error('Jobsheet material not found')
  }

  // Verify task belongs to same jobsheet
  const task = await db.machiningTask.findFirst({
    where: { id: taskId, jobsheetId: jobsheetMaterial.jobsheetId, tenantId }
  })

  if (!task) {
    throw new Error('Task not found in this jobsheet')
  }

  // Check available quantity
  const existingAllocations = await db.taskMaterialAllocation.aggregate({
    where: {
      tenantId,
      jobsheetMaterialId,
      status: { in: ['ALLOCATED', 'IN_USE'] }
    },
    _sum: { allocatedQty: true }
  })

  const alreadyAllocated = existingAllocations._sum.allocatedQty || 0
  const available = jobsheetMaterial.availableQty - alreadyAllocated

  if (quantity > available) {
    throw new Error(`Insufficient available quantity. Available: ${available}, Requested: ${quantity}`)
  }

  // Create task allocation
  const taskAllocation = await db.taskMaterialAllocation.create({
    data: {
      tenantId,
      jobsheetMaterialId,
      taskId,
      allocatedQty: quantity,
      remainingQty: quantity,
      unit: jobsheetMaterial.unit,
      status: 'ALLOCATED',
    },
    include: {
      jobsheetMaterial: true,
      task: true,
    }
  })

  // Update jobsheet material available qty
  await db.jobsheetMaterial.update({
    where: { id: jobsheetMaterialId },
    data: {
      availableQty: jobsheetMaterial.availableQty - quantity,
      status: 'IN_USE'
    }
  })

  return taskAllocation
}

// ============================================
// Consume Material at Task
// ============================================

export interface ConsumeMaterialInput {
  tenantId: string
  taskMaterialAllocationId: string
  consumedQty: number
  wastedQty?: number
  wasteReason?: string
  consumedBy: string
}

export async function consumeMaterialAtTask(input: ConsumeMaterialInput) {
  const { tenantId, taskMaterialAllocationId, consumedQty, wastedQty, wasteReason, consumedBy } = input

  // Get task allocation
  const taskAllocation = await db.taskMaterialAllocation.findFirst({
    where: { id: taskMaterialAllocationId, tenantId },
    include: { 
      jobsheetMaterial: {
        include: { materialRequirement: true }
      }
    }
  })

  if (!taskAllocation) {
    throw new Error('Task material allocation not found')
  }

  const totalUsage = consumedQty + (wastedQty || 0)
  
  if (totalUsage > taskAllocation.remainingQty) {
    throw new Error(`Cannot consume more than allocated. Remaining: ${taskAllocation.remainingQty}, Consumed: ${consumedQty}, Wasted: ${wastedQty || 0}`)
  }

  // Update task allocation
  const updated = await db.taskMaterialAllocation.update({
    where: { id: taskMaterialAllocationId },
    data: {
      consumedQty: taskAllocation.consumedQty + consumedQty,
      wastedQty: taskAllocation.wastedQty + (wastedQty || 0),
      remainingQty: taskAllocation.remainingQty - totalUsage,
      status: taskAllocation.remainingQty - totalUsage <= 0 ? 'CONSUMED' : 'IN_USE',
      consumedAt: new Date(),
      consumedBy,
      wasteReason: wasteReason || taskAllocation.wasteReason,
    }
  })

  // Update jobsheet material consumed qty
  await db.jobsheetMaterial.update({
    where: { id: taskAllocation.jobsheetMaterialId },
    data: {
      consumedQty: { increment: consumedQty + (wastedQty || 0) },
    }
  })

  // Update material requirement consumed qty
  if (taskAllocation.jobsheetMaterial.materialRequirementId) {
    await db.materialRequirement.update({
      where: { id: taskAllocation.jobsheetMaterial.materialRequirementId! },
      data: {
        consumedQty: { increment: consumedQty + (wastedQty || 0) },
      }
    })
  }

  // If wasted, create inventory transaction for waste
  if (wastedQty && wastedQty > 0) {
    await db.inventoryTransaction.create({
      data: {
        tenantId,
        inventoryId: taskAllocation.jobsheetMaterial.materialRequirement?.inventoryId || '',
        type: 'WASTE',
        quantity: -wastedQty,
        balance: 0,
        referenceType: 'TASK_WASTE',
        referenceId: taskAllocation.taskId,
        notes: `Wasted at task: ${wasteReason || 'No reason specified'}`,
        createdBy: consumedBy,
      }
    })
  }

  return updated
}

// ============================================
// Get Jobsheet Materials Summary
// ============================================

export async function getJobsheetMaterialsSummary(tenantId: string, jobsheetId: string) {
  const materials = await db.jobsheetMaterial.findMany({
    where: { tenantId, jobsheetId },
    include: {
      materialRequirement: true,
      taskAllocations: {
        include: {
          task: {
            select: { taskNumber: true, name: true, status: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const summary = {
    totalMaterials: materials.length,
    totalAllocated: materials.reduce((sum, m) => sum + m.allocatedQty, 0),
    totalConsumed: materials.reduce((sum, m) => sum + m.consumedQty, 0),
    totalAvailable: materials.reduce((sum, m) => sum + m.availableQty, 0),
    byStatus: {
      allocated: materials.filter(m => m.status === 'ALLOCATED').length,
      inUse: materials.filter(m => m.status === 'IN_USE').length,
      consumed: materials.filter(m => m.status === 'CONSUMED').length,
    }
  }

  // Flatten all task allocations with proper nesting
  const taskAllocations = materials.flatMap(m => 
    m.taskAllocations.map(ta => ({
      ...ta,
      materialName: m.name,
      partNumber: m.partNumber,
      jobsheetMaterial: {
        id: m.id,
        name: m.name,
        partNumber: m.partNumber,
        allocatedQty: m.allocatedQty,
        materialRequirement: m.materialRequirement,
      },
    }))
  )

  return { 
    materials, 
    jobAllocations: materials,  // Alias for page compatibility
    taskAllocations,            // Flattened task allocations
    summary 
  }
}

// ============================================
// Auto-distribute materials to all jobsheets
// ============================================

export async function autoDistributeMaterialsToJobsheets(
  tenantId: string,
  moId: string,
  distributedBy: string
) {
  // Get MO with material requirements
  const mo = await db.manufacturingOrder.findFirst({
    where: { id: moId, tenantId },
    include: {
      jobsheets: {
        include: { machiningTasks: true }
      },
      materialRequirements: {
        where: { status: { in: ['RESERVED', 'PARTIALLY_RESERVED'] } }
      }
    }
  })

  if (!mo) {
    throw new Error('Manufacturing Order not found')
  }

  if (mo.jobsheets.length === 0) {
    throw new Error('No jobsheets found for this MO')
  }

  const results = []

  // For each jobsheet, distribute materials based on task count
  for (const jobsheet of mo.jobsheets) {
    const taskCount = jobsheet.machiningTasks.length || 1
    
    for (const materialReq of mo.materialRequirements) {
      // Calculate allocation per jobsheet (equal distribution)
      const allocateQty = materialReq.reservedQty / mo.jobsheets.length

      if (allocateQty > 0) {
        const allocation = await db.jobsheetMaterial.create({
          data: {
            tenantId,
            jobsheetId: jobsheet.id,
            materialRequirementId: materialReq.id,
            partNumber: materialReq.partNumber,
            name: materialReq.name,
            allocatedQty: allocateQty,
            availableQty: allocateQty,
            unit: materialReq.unit,
            status: 'ALLOCATED',
            allocatedBy: distributedBy,
            notes: `Auto-distributed from MO ${mo.moNumber}`,
          }
        })
        results.push(allocation)
      }
    }

    // Update jobsheet status
    await db.jobsheet.update({
      where: { id: jobsheet.id },
      data: { status: 'READY' }
    })
  }

  return {
    distributed: results.length,
    jobsheets: mo.jobsheets.length,
    allocations: results
  }
}
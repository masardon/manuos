// Material Requirements Service for ManuOS
// Handles PPIC material planning, auto-reservation, and purchase requests

import { db } from '@/lib/db'
import { syncPurchaseOrdersToOdoo } from '@/lib/integrations/odoo'
import { recordInventoryMovement, receivePurchaseOrder, reserveInventoryForMO } from '@/lib/inventory/inventory-ledger'

export interface MaterialRequirementInput {
  partNumber: string
  name: string
  description?: string
  category?: string
  requiredQty: number
  unit?: string
  requiredDate: Date
  priority?: number
  specifications?: string
  inventoryId?: string  // Pre-linked inventory item
}

export interface ReservationResult {
  success: boolean
  reservedQty: number
  inventoryId?: string
  message: string
}

export interface PurchaseRequestResult {
  success: boolean
  prId?: string
  prNumber?: string
  requestedQty: number
  message: string
}

/**
 * Add material requirements to a Manufacturing Order
 * This is the main PPIC function to specify what materials are needed
 */
export async function addMaterialRequirements(
  tenantId: string,
  moId: string,
  materials: MaterialRequirementInput[],
  createdBy: string
) {
  const results = []
  
  for (const material of materials) {
    try {
      // Check if requirement already exists
      const existing = await db.materialRequirement.findUnique({
        where: {
          tenantId_moId_partNumber: {
            tenantId,
            moId,
            partNumber: material.partNumber
          }
        }
      })
      
      if (existing) {
        // Update existing requirement
        const updated = await db.materialRequirement.update({
          where: { id: existing.id },
          data: {
            requiredQty: material.requiredQty,
            requiredDate: material.requiredDate,
            priority: material.priority || 5,
            specifications: material.specifications,
            updatedAt: new Date()
          }
        })
        results.push({ success: true, requirement: updated, action: 'updated' })
      } else {
        // Create new requirement
        const created = await db.materialRequirement.create({
          data: {
            tenantId,
            moId,
            partNumber: material.partNumber,
            name: material.name,
            description: material.description,
            category: material.category,
            requiredQty: material.requiredQty,
            unit: material.unit,
            requiredDate: material.requiredDate,
            priority: material.priority || 5,
            specifications: material.specifications,
            inventoryId: material.inventoryId,
            status: 'PLANNED',
            createdBy
          }
        })
        results.push({ success: true, requirement: created, action: 'created' })
      }
    } catch (error) {
      results.push({ 
        success: false, 
        partNumber: material.partNumber, 
        error: String(error) 
      })
    }
  }
  
  return results
}

/**
 * Auto-reserve materials from stock
 * Checks available quantity and creates reservations
 */
export async function autoReserveMaterials(
  tenantId: string,
  moId: string,
  createdBy: string
) {
  const requirements = await db.materialRequirement.findMany({
    where: {
      tenantId,
      moId,
      status: { in: ['PLANNED', 'PARTIALLY_RESERVED'] }
    },
    include: {
      inventory: true
    }
  })
  
  const results = []
  
  for (const req of requirements) {
    // Find available inventory for this part
    const availableInventory = await db.inventory.findFirst({
      where: {
        tenantId,
        partNumber: req.partNumber,
        status: 'AVAILABLE',
        availableQty: { gt: 0 }
      },
      orderBy: [
        { receivedDate: 'asc' }  // FIFO - First In First Out
      ]
    })
    
    if (!availableInventory) {
      // No stock available - will need to purchase
      results.push({
        requirementId: req.id,
        partNumber: req.partNumber,
        status: 'NO_STOCK',
        reservedQty: 0,
        message: 'No available stock found'
      })
      continue
    }
    
    // Calculate how much we can reserve
    const neededQty = req.requiredQty - req.reservedQty
    const canReserve = Math.min(neededQty, availableInventory.availableQty)
    
    if (canReserve <= 0) {
      continue
    }
    
    // Create reservation and update inventory using ledger service
    await reserveInventoryForMO({
      tenantId,
      inventoryId: availableInventory.id,
      moId,
      quantity: canReserve,
      reservedBy: createdBy,
    })
    
    // Update material requirement
    await db.materialRequirement.update({
      where: { id: req.id },
      data: {
        reservedQty: { increment: canReserve },
        status: (req.reservedQty + canReserve >= req.requiredQty) ? 'RESERVED' : 'PARTIALLY_RESERVED'
      }
    })
    
    results.push({
      requirementId: req.id,
      partNumber: req.partNumber,
      status: 'RESERVED',
      reservedQty: canReserve,
      inventoryId: availableInventory.id,
      message: `Reserved ${canReserve} ${req.unit || 'units'}`
    })
  }
  
  return results
}

/**
 * Generate Purchase Requests for unreserved materials
 */
export async function generatePurchaseRequests(
  tenantId: string,
  moId: string,
  createdBy: string
) {
  // Find requirements that need purchasing
  const requirements = await db.materialRequirement.findMany({
    where: {
      tenantId,
      moId,
      status: { in: ['PLANNED', 'PARTIALLY_RESERVED'] }
    }
  })
  
  // Group by supplier (if known) or create separate PRs
  const prItems = []
  let totalAmount = 0
  
  for (const req of requirements) {
    const neededQty = req.requiredQty - req.reservedQty - req.receivedQty
    
    if (neededQty <= 0) continue
    
    // Find inventory item for pricing
    const inventory = await db.inventory.findFirst({
      where: { tenantId, partNumber: req.partNumber }
    })
    
    const unitPrice = inventory?.unitPrice || 0
    
    prItems.push({
      partNumber: req.partNumber,
      name: req.name,
      description: req.description,
      materialRequirementId: req.id,
      inventoryId: inventory?.id,
      quantity: neededQty,
      unitPrice,
      totalPrice: neededQty * unitPrice,
      unit: req.unit
    })
    
    totalAmount += neededQty * unitPrice
  }
  
  if (prItems.length === 0) {
    return {
      success: false,
      message: 'No materials need purchasing'
    }
  }
  
  // Get MO info for PR title
  const mo = await db.manufacturingOrder.findFirst({
    where: { id: moId, tenantId },
    include: { order: true }
  })
  
  // Generate PR number
  const prCount = await db.purchaseRequest.count({ where: { tenantId } })
  const prNumber = `PR-${new Date().getFullYear()}-${String(prCount + 1).padStart(4, '0')}`
  
  // Get earliest required date
  const earliestDate = requirements
    .filter(r => r.requiredQty - r.reservedQty - r.receivedQty > 0)
    .reduce((min, r) => r.requiredDate < min ? r.requiredDate : min, new Date())
  
  // Create Purchase Request with items in transaction
  const [pr] = await db.$transaction([
    db.purchaseRequest.create({
      data: {
        tenantId,
        prNumber,
        title: `Material for ${mo?.moNumber || moId}`,
        description: `Auto-generated for ${mo?.name || 'Manufacturing Order'}`,
        status: 'DRAFT',
        priority: Math.min(...requirements.map(r => r.priority || 5)),
        sourceType: 'AUTO_MO',
        sourceMoId: moId,
        requiredDate: earliestDate,
        totalItems: prItems.length,
        estimatedAmount: totalAmount,
        createdBy
      }
    })
  ])
  
  // Create PR items
  for (const item of prItems) {
    await db.purchaseRequestItem.create({
      data: {
        tenantId,
        purchaseRequestId: pr.id,
        materialRequirementId: item.materialRequirementId,
        partNumber: item.partNumber,
        name: item.name,
        description: item.description,
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        unit: item.unit
      }
    })
    
    // Update material requirement status
    await db.materialRequirement.update({
      where: { id: item.materialRequirementId },
      data: {
        status: 'PURCHASE_REQUESTED',
        requestedQty: item.quantity
      }
    })
  }
  
  return {
    success: true,
    prId: pr.id,
    prNumber: pr.prNumber,
    totalItems: prItems.length,
    estimatedAmount: totalAmount,
    message: `Created ${prNumber} with ${prItems.length} items`
  }
}

/**
 * Complete workflow: Add materials → Reserve stock → Generate PRs → Push to Odoo
 */
export async function executeMaterialPlanningWorkflow(
  tenantId: string,
  moId: string,
  materials: MaterialRequirementInput[],
  createdBy: string,
  pushToOdoo: boolean = true
) {
  console.log('Starting material planning workflow for MO:', moId)
  
  // Step 1: Add material requirements
  console.log('Step 1: Adding material requirements...')
  const addResults = await addMaterialRequirements(tenantId, moId, materials, createdBy)
  
  // Step 2: Auto-reserve from stock
  console.log('Step 2: Auto-reserving materials...')
  const reserveResults = await autoReserveMaterials(tenantId, moId, createdBy)
  
  // Step 3: Generate purchase requests for unreserved items
  console.log('Step 3: Generating purchase requests...')
  const prResult = await generatePurchaseRequests(tenantId, moId, createdBy)
  
  // Step 4: Push to Odoo if requested and PR was created
  let odooSyncResult = null
  if (pushToOdoo && prResult.success && prResult.prId) {
    console.log('Step 4: Syncing to Odoo...')
    odooSyncResult = await syncPurchaseOrdersToOdoo(tenantId)
  }
  
  // Update MO status to MATERIAL_PREPARATION
  await db.manufacturingOrder.update({
    where: { id: moId },
    data: { status: 'SCHEDULED' }
  })
  
  return {
    requirements: addResults,
    reservations: reserveResults,
    purchaseRequest: prResult,
    odooSync: odooSyncResult,
    summary: {
      totalMaterials: materials.length,
      reserved: reserveResults.filter(r => r.status === 'RESERVED' || r.status === 'PARTIALLY_RESERVED').length,
      needsPurchase: prResult.success ? prResult.totalItems : 0,
      estimatedCost: prResult.estimatedAmount || 0
    }
  }
}

/**
 * Receive goods and update related entities
 */
export async function receiveGoods(
  tenantId: string,
  purchaseRequestId: string,
  receivedItems: Array<{
    prItemId: string
    receivedQty: number
    location?: string
    batch?: string
  }>,
  receivedBy: string
) {
  const results = []
  
  for (const item of receivedItems) {
    const prItem = await db.purchaseRequestItem.findFirst({
      where: {
        id: item.prItemId,
        tenantId,
        purchaseRequestId
      },
      include: {
        purchaseRequest: true,
        materialRequirement: true,
        inventory: true
      }
    })
    
    if (!prItem) {
      results.push({ success: false, itemId: item.prItemId, error: 'Item not found' })
      continue
    }
    
    // Update or create inventory
    let inventoryId = prItem.inventoryId
    
    if (!inventoryId) {
      // Create new inventory item
      const newInventory = await db.inventory.create({
        data: {
          tenantId,
          partNumber: prItem.partNumber,
          name: prItem.name,
          description: prItem.description,
          quantity: item.receivedQty,
          availableQty: item.receivedQty,
          unit: prItem.unit,
          location: item.location,
          batch: item.batch,
          status: 'AVAILABLE',
          supplierId: prItem.supplierId,
          unitPrice: prItem.unitPrice,
          currency: prItem.purchaseRequest.currency
        }
      })
      inventoryId = newInventory.id
    } else {
      // Update existing inventory
      await db.inventory.update({
        where: { id: inventoryId },
        data: {
          quantity: { increment: item.receivedQty },
          availableQty: { increment: item.receivedQty },
          location: item.location || undefined,
          batch: item.batch || undefined
        }
      })
    }
    
    // Create receipt transaction using inventory ledger service
    await recordInventoryMovement({
      tenantId,
      inventoryId,
      type: 'RECEIPT',
      quantity: item.receivedQty,
      referenceType: 'PURCHASE_ORDER',
      referenceId: purchaseRequestId,
      toLocationId: item.location,
      performedBy: receivedBy,
      notes: `Received from PO ${prItem.purchaseRequest.prNumber}`,
    })
    
    // Update PR item
    await db.purchaseRequestItem.update({
      where: { id: item.prItemId },
      data: {
        receivedQty: { increment: item.receivedQty },
        status: 'RECEIVED'
      }
    })
    
    // Update material requirement if linked
    if (prItem.materialRequirementId) {
      await db.materialRequirement.update({
        where: { id: prItem.materialRequirementId },
        data: {
          receivedQty: { increment: item.receivedQty },
          inventoryId
        }
      })
    }
    
    results.push({
      success: true,
      itemId: item.prItemId,
      inventoryId,
      receivedQty: item.receivedQty
    })
  }
  
  // Check if all PR items are received
  const prItems = await db.purchaseRequestItem.findMany({
    where: { purchaseRequestId, tenantId }
  })
  
  const allReceived = prItems.every(item => item.receivedQty >= item.quantity)
  
  if (allReceived) {
    await db.purchaseRequest.update({
      where: { id: purchaseRequestId },
      data: { status: 'RECEIVED' }
    })
  }
  
  return {
    success: true,
    items: results,
    prComplete: allReceived
  }
}

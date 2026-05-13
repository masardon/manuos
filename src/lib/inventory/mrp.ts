// Material Requirements Planning (MRP) Service for ManuOS
// Auto-calculates material requirements based on BOM/Recipe

import { db } from '@/lib/db'

// ============================================
// MRP Calculation Engine
// ============================================

export interface MRPCalculationResult {
  moId: string
  moNumber: string
  finishedGood: {
    partNumber: string
    name: string
    quantity: number
    unit?: string
  }
  recipe?: {
    id: string
    code: string
    name: string
  }
  materials: {
    partNumber: string
    name: string
    quantityRequired: number
    unit?: string
    wastePercentage: number
    isCritical: boolean
    availableStock: number
    shortage: number
    status: 'RESERVED' | 'PARTIALLY_RESERVED' | 'PURCHASE_NEEDED' | 'NO_STOCK'
  }[]
  summary: {
    totalMaterials: number
    fullyReserved: number
    partiallyReserved: number
    needsPurchase: number
  }
}

/**
 * Calculate material requirements based on Recipe/BOM
 * Called when MO is created or quantity changes
 */
export async function calculateMaterialRequirements(
  tenantId: string,
  moId: string
): Promise<MRPCalculationResult> {
  // Get MO with recipe
  const mo = await db.manufacturingOrder.findFirst({
    where: { id: moId, tenantId },
    include: {
      recipe: {
        include: {
          ingredients: true,
        },
      },
    },
  })

  if (!mo) {
    throw new Error('Manufacturing Order not found')
  }

  if (!mo.recipe) {
    throw new Error('Manufacturing Order has no recipe/BOM assigned')
  }

  const recipe = mo.recipe
  const moQuantity = 1 // Default, can be extended

  // Calculate material requirements from recipe
  const materialResults: MRPCalculationResult['materials'] = []

  for (const ingredient of recipe.ingredients) {
    // Calculate required quantity (including waste)
    const baseQuantity = ingredient.quantity * moQuantity
    const wasteAmount = baseQuantity * (ingredient.wastePercentage / 100)
    const totalRequired = baseQuantity + wasteAmount

    // Get available stock for this material
    const availableStock = await getAvailableStock(tenantId, ingredient.partNumber)

    // Determine status
    let status: MRPCalculationResult['materials'][0]['status']
    let shortage = 0

    if (availableStock >= totalRequired) {
      status = 'RESERVED'
    } else if (availableStock > 0) {
      status = 'PARTIALLY_RESERVED'
      shortage = totalRequired - availableStock
    } else {
      status = 'NO_STOCK'
      shortage = totalRequired
    }

    materialResults.push({
      partNumber: ingredient.partNumber,
      name: ingredient.name,
      quantityRequired: totalRequired,
      unit: ingredient.unit || undefined,
      wastePercentage: ingredient.wastePercentage,
      isCritical: ingredient.isCritical,
      availableStock,
      shortage,
      status,
    })
  }

  // Calculate summary
  const summary = {
    totalMaterials: materialResults.length,
    fullyReserved: materialResults.filter(m => m.status === 'RESERVED').length,
    partiallyReserved: materialResults.filter(m => m.status === 'PARTIALLY_RESERVED').length,
    needsPurchase: materialResults.filter(m => m.status === 'NO_STOCK' || m.status === 'PARTIALLY_RESERVED').length,
  }

  return {
    moId: mo.id,
    moNumber: mo.moNumber,
    finishedGood: {
      partNumber: recipe.outputPartNumber,
      name: recipe.outputName,
      quantity: recipe.outputQuantity * moQuantity,
      unit: recipe.outputUnit || undefined,
    },
    recipe: {
      id: recipe.id,
      code: recipe.code,
      name: recipe.name,
    },
    materials: materialResults,
    summary,
  }
}

/**
 * Get available stock for a part number (sum of all available inventory)
 */
async function getAvailableStock(tenantId: string, partNumber: string): Promise<number> {
  const inventory = await db.inventory.aggregate({
    where: {
      tenantId,
      partNumber,
      status: 'AVAILABLE',
    },
    _sum: {
      availableQty: true,
    },
  })

  return inventory._sum.availableQty || 0
}

/**
 * Auto-generate Material Requirements from Recipe
 * Called after MO is created
 */
export async function autoGenerateMaterialRequirements(
  tenantId: string,
  moId: string,
  createdBy: string
): Promise<{ created: number; requirements: any[] }> {
  const calculation = await calculateMaterialRequirements(tenantId, moId)

  const requirements = []

  for (const material of calculation.materials) {
    // Check if requirement already exists
    const existing = await db.materialRequirement.findFirst({
      where: {
        tenantId,
        moId,
        partNumber: material.partNumber,
      },
    })

    if (!existing) {
      // Create material requirement
      const req = await db.materialRequirement.create({
        data: {
          tenantId,
          moId,
          partNumber: material.partNumber,
          name: material.name,
          requiredQty: material.quantityRequired,
          unit: material.unit,
          requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
          priority: material.isCritical ? 1 : 5,
          status: material.status === 'RESERVED' ? 'RESERVED' : 
                  material.status === 'PARTIALLY_RESERVED' ? 'PARTIALLY_RESERVED' : 
                  'PLANNED',
          reservedQty: material.availableStock,
        },
      })
      requirements.push(req)
    }
  }

  return {
    created: requirements.length,
    requirements,
  }
}

/**
 * Auto-reserve materials from available stock
 */
export async function autoReserveFromStock(
  tenantId: string,
  moId: string,
  createdBy: string
): Promise<{ reserved: number; details: any[] }> {
  const requirements = await db.materialRequirement.findMany({
    where: {
      tenantId,
      moId,
      status: { in: ['PLANNED', 'PARTIALLY_RESERVED'] },
    },
  })

  const results = []

  for (const req of requirements) {
    // Find available inventory (FIFO - oldest first)
    const availableInventory = await db.inventory.findMany({
      where: {
        tenantId,
        partNumber: req.partNumber,
        status: 'AVAILABLE',
        availableQty: { gt: 0 },
      },
      orderBy: { receivedAt: 'asc' },
    })

    let remainingToReserve = req.requiredQty - req.reservedQty

    for (const inv of availableInventory) {
      if (remainingToReserve <= 0) break

      const qtyToReserve = Math.min(inv.availableQty, remainingToReserve)

      // Create reservation
      await db.inventoryReservation.create({
        data: {
          tenantId,
          inventoryId: inv.id,
          moId,
          materialRequirementId: req.id,
          quantity: qtyToReserve,
          status: 'ALLOCATED',
          createdBy,
        },
      })

      // Update inventory
      await db.inventory.update({
        where: { id: inv.id },
        data: {
          reservedQty: { increment: qtyToReserve },
          availableQty: { decrement: qtyToReserve },
        },
      })

      remainingToReserve -= qtyToReserve
    }

    // Update requirement status
    const newReservedQty = req.reservedQty + (req.requiredQty - req.reservedQty - remainingToReserve)
    const newStatus = newReservedQty >= req.requiredQty ? 'RESERVED' : 
                     newReservedQty > 0 ? 'PARTIALLY_RESERVED' : 'PLANNED'

    await db.materialRequirement.update({
      where: { id: req.id },
      data: {
        reservedQty: newReservedQty,
        status: newStatus,
      },
    })

    results.push({
      partNumber: req.partNumber,
      required: req.requiredQty,
      reserved: newReservedQty,
      remaining: req.requiredQty - newReservedQty,
      status: newStatus,
    })
  }

  return {
    reserved: results.filter(r => r.status === 'RESERVED' || r.status === 'PARTIALLY_RESERVED').length,
    details: results,
  }
}

/**
 * Generate Purchase Requests for materials not in stock
 */
export async function generatePRForShortage(
  tenantId: string,
  moId: string,
  createdBy: string
): Promise<{ prCreated: boolean; prNumber?: string; items: any[] }> {
  const requirements = await db.materialRequirement.findMany({
    where: {
      tenantId,
      moId,
      status: { in: ['PLANNED', 'PARTIALLY_RESERVED'] },
    },
  })

  const shortageItems = requirements
    .filter(r => r.requiredQty > r.reservedQty)
    .map(r => ({
      partNumber: r.partNumber,
      name: r.name,
      quantity: r.requiredQty - r.reservedQty,
      unit: r.unit,
    }))

  if (shortageItems.length === 0) {
    return { prCreated: false, items: [] }
  }

  // Create Purchase Request
  const year = new Date().getFullYear()
  const prefix = `PR-${year}-`
  const lastPR = await db.purchaseRequest.findFirst({
    where: { tenantId, prNumber: { startsWith: prefix } },
    orderBy: { prNumber: 'desc' },
  })
  const sequence = lastPR ? parseInt(lastPR.prNumber.replace(prefix, ''), 10) + 1 : 1
  const prNumber = `${prefix}${sequence.toString().padStart(3, '0')}`

  const totalAmount = shortageItems.reduce((sum, item) => sum + (item.quantity * 100000), 0)

  // Create PR and items in transaction
  const [pr] = await db.$transaction([
    db.purchaseRequest.create({
      data: {
        tenantId,
        prNumber,
        title: `Materials for MO - Auto-generated`,
        description: `Auto-generated purchase request for shortage materials in MO`,
        status: 'SUBMITTED',
        priority: 5,
        sourceType: 'AUTO_MO',
        sourceMoId: moId,
        requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalItems: shortageItems.length,
        estimatedAmount: totalAmount,
        currency: 'IDR',
        createdBy,
      }
    })
  ])

  // Create PR items
  for (const item of shortageItems) {
    await db.purchaseRequestItem.create({
      data: {
        tenantId,
        purchaseRequestId: pr.id,
        partNumber: item.partNumber,
        name: item.name,
        description: item.name,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        unitPrice: 100000,
        totalPrice: item.quantity * 100000,
      }
    })
  }

  // Update material requirements with PR link
  for (const req of requirements.filter(r => r.requiredQty > r.reservedQty)) {
    await db.materialRequirement.update({
      where: { id: req.id },
      data: {
        status: 'PURCHASE_REQUESTED',
      },
    })
  }

  return {
    prCreated: true,
    prNumber: pr.prNumber,
    items: shortageItems,
  }
}

/**
 * Full MRP Workflow: Calculate → Reserve → Generate PR
 */
export async function executeFullMRPWorkflow(
  tenantId: string,
  moId: string,
  createdBy: string
): Promise<{
  calculation: MRPCalculationResult
  reservation: { reserved: number; details: any[] }
  purchaseRequest: { prCreated: boolean; prNumber?: string; items: any[] }
}> {
  // 1. Calculate requirements from BOM
  const calculation = await calculateMaterialRequirements(tenantId, moId)

  // 2. Auto-generate material requirements
  await autoGenerateMaterialRequirements(tenantId, moId, createdBy)

  // 3. Auto-reserve from stock
  const reservation = await autoReserveFromStock(tenantId, moId, createdBy)

  // 4. Generate PR for shortages
  const purchaseRequest = await generatePRForShortage(tenantId, moId, createdBy)

  return {
    calculation,
    reservation,
    purchaseRequest,
  }
}
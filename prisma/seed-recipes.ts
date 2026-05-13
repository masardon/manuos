// Seed script for Recipes/BOMs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('📋 Seeding Recipes/BOMs...')

  // Recipe 1: Bearing Assembly (Finished Good)
  const bearingRecipe = await prisma.recipe.upsert({
    where: { tenantId_code_version: { tenantId: TENANT_ID, code: 'RCP-BRG-001', version: '1.0' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'RCP-BRG-001',
      name: 'Bearing Assembly XYZ',
      description: 'Standard bearing assembly with housing',
      outputPartNumber: 'FG-BRG-XYZ',
      outputName: 'Bearing Assembly XYZ',
      outputQuantity: 1,
      outputUnit: 'pcs',
      isActive: true,
      isApproved: true,
    },
  })

  // Ingredients for Bearing Assembly
  const bearingIngredients = [
    { partNumber: 'RM-STL-001', name: 'Steel Bearing Ring', quantity: 2, unit: 'pcs', isCritical: true, wastePercentage: 2 },
    { partNumber: 'RM-BRG-001', name: 'Ball Bearing Insert', quantity: 1, unit: 'pcs', isCritical: true, wastePercentage: 0 },
    { partNumber: 'RM-GRS-001', name: 'Grease (100g)', quantity: 0.1, unit: 'kg', isCritical: false, wastePercentage: 5 },
    { partNumber: 'RM-SEL-001', name: 'Seal Ring', quantity: 2, unit: 'pcs', isCritical: false, wastePercentage: 1 },
  ]

  for (const ing of bearingIngredients) {
    // Find inventory item for this ingredient
    const inv = await prisma.inventory.findFirst({ where: { tenantId: TENANT_ID, partNumber: ing.partNumber } })
    
    const existing = await prisma.recipeIngredient.findFirst({
      where: { tenantId: TENANT_ID, recipeId: bearingRecipe.id, partNumber: ing.partNumber }
    })
    
    if (!existing) {
      await prisma.recipeIngredient.create({
        data: {
          tenantId: TENANT_ID,
          recipeId: bearingRecipe.id,
          inventoryId: inv?.id,
          partNumber: ing.partNumber,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isCritical: ing.isCritical,
          wastePercentage: ing.wastePercentage,
          mixOrder: bearingIngredients.indexOf(ing) + 1,
        },
      })
    }
  }

  // Recipe 2: Bracket Assembly
  const bracketRecipe = await prisma.recipe.upsert({
    where: { tenantId_code_version: { tenantId: TENANT_ID, code: 'RCP-BRK-001', version: '1.0' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'RCP-BRK-001',
      name: 'Aluminum Bracket Assembly',
      description: 'CNC machined aluminum bracket',
      outputPartNumber: 'FG-BRK-ALU',
      outputName: 'Aluminum Bracket Assembly',
      outputQuantity: 1,
      outputUnit: 'pcs',
      isActive: true,
      isApproved: true,
    },
  })

  const bracketIngredients = [
    { partNumber: 'RM-ALU-001', name: 'Aluminum Bar 50mm', quantity: 0.5, unit: 'kg', isCritical: true, wastePercentage: 15 },
    { partNumber: 'RM-BLT-001', name: 'M8 Bolt', quantity: 4, unit: 'pcs', isCritical: false, wastePercentage: 2 },
    { partNumber: 'RM-NUT-001', name: 'M8 Nut', quantity: 4, unit: 'pcs', isCritical: false, wastePercentage: 1 },
    { partNumber: 'RM-WSH-001', name: 'M8 Washer', quantity: 8, unit: 'pcs', isCritical: false, wastePercentage: 1 },
  ]

  for (const ing of bracketIngredients) {
    const inv = await prisma.inventory.findFirst({ where: { tenantId: TENANT_ID, partNumber: ing.partNumber } })
    
    const existing = await prisma.recipeIngredient.findFirst({
      where: { tenantId: TENANT_ID, recipeId: bracketRecipe.id, partNumber: ing.partNumber }
    })
    
    if (!existing) {
      await prisma.recipeIngredient.create({
        data: {
          tenantId: TENANT_ID,
          recipeId: bracketRecipe.id,
          inventoryId: inv?.id,
          partNumber: ing.partNumber,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isCritical: ing.isCritical,
          wastePercentage: ing.wastePercentage,
          mixOrder: bracketIngredients.indexOf(ing) + 1,
        },
      })
    }
  }

  // Link MO-001 to Bearing Recipe
  const mo1 = await prisma.manufacturingOrder.findFirst({ where: { tenantId: TENANT_ID, moNumber: 'MO-001' } })
  if (mo1) {
    await prisma.manufacturingOrder.update({
      where: { id: mo1.id },
      data: { recipeId: bearingRecipe.id },
    })
  }

  console.log('✅ Recipes/BOMs seeded successfully!')
  console.log(`   - ${bearingRecipe.name} (links ${bearingIngredients.length} materials)`)
  console.log(`   - ${bracketRecipe.name} (links ${bracketIngredients.length} materials)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
/**
 * Reset Script - Clears all manufacturing data but PRESERVES:
 * - Users
 * - Roles
 * - Permissions
 * - User Settings
 * - System Settings
 * - Tenant, Business Unit, Board
 * 
 * This allows resetting manufacturing data while keeping authentication intact.
 * 
 * Run with: bun run db:reset-manufacturing
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🧹 RESETTING MANUFACTURING DATA...\n')
  console.log('=====================================================')
  console.log('Preserving: Users, Roles, Permissions, Settings')
  console.log('Clearing: All manufacturing data')
  console.log('=====================================================\n')

  // 1. Clear Quality Control data
  console.log('📋 Clearing Quality Control...')
  await prisma.reworkTask.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.reworkOrderItem.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.reworkOrder.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.qualityCheckItem.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.qualityCheck.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared QC data')

  // 2. Clear Material Handoffs
  console.log('\n🔄 Clearing Material Handoffs...')
  await prisma.materialHandoffItem.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.materialHandoff.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared handoff data')

  // 3. Clear Inventory Transactions & Reservations
  console.log('\n📦 Clearing Inventory Transactions...')
  await prisma.inventoryReservation.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.inventoryTransaction.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared inventory transactions')

  // 4. Clear Material Requirements & MRP
  console.log('\n📊 Clearing Material Requirements...')
  await prisma.materialRequirement.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.taskMaterialAllocation.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.jobsheetMaterial.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared material requirements')

  // 5. Clear Purchase Requests
  console.log('\n🛍️  Clearing Purchase Requests...')
  await prisma.purchaseRequestItem.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.purchaseRequest.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared purchase requests')

  // 6. Clear Vendor Orders
  console.log('\n🏭 Clearing Vendor Orders...')
  await prisma.vendorInvoice.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.vendorShipment.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.vendorOrderItem.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.vendorOrder.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared vendor orders')

  // 7. Clear Machine Breakdowns
  console.log('\n⚠️  Clearing Machine Breakdowns...')
  await prisma.breakdown.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared breakdown data')

  // 8. Clear Tasks
  console.log('\n⚙️  Clearing Tasks...')
  await prisma.machiningTask.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared tasks')

  // 9. Clear Jobsheets
  console.log('\n📋 Clearing Jobsheets...')
  await prisma.jobsheet.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared jobsheets')

  // 10. Clear Manufacturing Orders
  console.log('\n🏭 Clearing Manufacturing Orders...')
  await prisma.manufacturingOrder.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared manufacturing orders')

  // 11. Clear Orders
  console.log('\n🛒 Clearing Orders...')
  await prisma.order.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared orders')

  // 12. Clear Inventory (but keep locations/shelves)
  console.log('\n📦 Clearing Inventory...')
  await prisma.inventory.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared inventory')

  // 13. Clear Recipes (but keep location/vendor data)
  console.log('\n📋 Clearing Recipes...')
  await prisma.recipeIngredient.deleteMany({ where: { tenantId: TENANT_ID } })
  await prisma.recipe.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared recipes')

  // 14. Clear Suppliers (preserving user roles)
  console.log('\n🏭 Clearing Suppliers...')
  await prisma.supplier.deleteMany({ where: { tenantId: TENANT_ID } })
  console.log('   ✓ Cleared suppliers')

  // 15. Clear Locations (optional - can keep if you want to preserve location structure)
  // Uncomment if you want to reset locations too
  // console.log('\n📍 Clearing Locations...')
  // await prisma.shelf.deleteMany({ where: { tenantId: TENANT_ID } })
  // await prisma.location.deleteMany({ where: { tenantId: TENANT_ID } })
  // console.log('   ✓ Cleared locations')

  console.log('\n=====================================================')
  console.log('✅ MANUFACTURING DATA RESET COMPLETE!')
  console.log('=====================================================')
  console.log('\n📊 PRESERVED DATA:')
  
  const users = await prisma.user.count({ where: { tenantId: TENANT_ID } })
  const roles = await prisma.role.count()
  const permissions = await prisma.permission.count()
  const locations = await prisma.location.count({ where: { tenantId: TENANT_ID } })
  
  console.log(`   - Users: ${users}`)
  console.log(`   - Roles: ${roles}`)
  console.log(`   - Permissions: ${permissions}`)
  console.log(`   - Locations: ${locations} (preserved)`)
  
  console.log('\n🔄 NEXT STEPS:')
  console.log('   1. Run: bun run db:seed-comprehensive')
  console.log('   2. Start: bun run dev')
  console.log('   3. Login: admin@ypti.com / demo123')
  console.log('=====================================================')
}

main()
  .catch((e) => {
    console.error('❌ RESET FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
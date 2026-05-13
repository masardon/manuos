// Seed script for Quality Control demo data
// Run with: npx tsx prisma/seed-qc.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenantId = 'demo-tenant'

  console.log('Creating Quality Control demo data...')

  // Get existing data
  const inventory = await prisma.inventory.findMany({
    where: { tenantId, category: 'Finished Goods' },
    take: 3,
  })

  const orders = await prisma.order.findMany({
    where: { tenantId },
    take: 2,
  })

  const mos = await prisma.manufacturingOrder.findFirst({
    where: { tenantId, moNumber: 'MO-2026-001' },
  })

  // Create QC checklist templates as check items
  const qcChecks = [
    { code: 'VIS-001', name: 'Visual Inspection', category: 'VISUAL', method: 'VISUAL' },
    { code: 'DIM-001', name: 'Dimension Check - Length', category: 'DIMENSIONAL', method: 'MEASURE', min: 99, max: 101, unit: 'mm' },
    { code: 'DIM-002', name: 'Dimension Check - Width', category: 'DIMENSIONAL', method: 'MEASURE', min: 49, max: 51, unit: 'mm' },
    { code: 'FUN-001', name: 'Functionality Test', category: 'FUNCTIONAL', method: 'TEST' },
    { code: 'MAT-001', name: 'Material Certification', category: 'MATERIAL', method: 'VISUAL' },
  ]

  // Create Quality Checks
  const qc1 = await prisma.qualityCheck.create({
    data: {
      tenantId,
      qcNumber: 'QC-2026-001',
      referenceType: 'MO',
      referenceId: mos?.id || 'demo',
      moId: mos?.id,
      orderId: orders[0]?.id,
      checkType: 'FINAL',
      inspectionStage: 'POST_PRODUCTION',
      partNumber: 'FG-001',
      productName: 'Finished Bracket Assembly',
      batch: 'BATCH-2026-001',
      quantity: 100,
      unit: 'pcs',
      status: 'PASSED',
      passQuantity: 98,
      failQuantity: 1,
      reworkQuantity: 1,
      defectCode: 'DENT',
      defectDescription: 'Minor surface dent on 1 unit',
      defectCategory: 'COSMETIC',
      customerApprovalRequired: true,
      customerApproved: false,
      completedAt: new Date(),
      checkItems: {
        create: qcChecks.map((check, index) => ({
          tenantId,
          criteriaCode: check.code,
          criteriaName: check.name,
          category: check.category,
          checkMethod: check.method,
          specification: check.min && check.max ? `${check.min}-${check.max} ${check.unit}` : undefined,
          minValue: check.min,
          maxValue: check.max,
          unit: check.unit,
          result: index === qcChecks.length - 1 ? 'FAIL' : 'PASS',
          defectCode: index === qcChecks.length - 1 ? 'DENT' : undefined,
          defectSeverity: index === qcChecks.length - 1 ? 'MINOR' : undefined,
          order: index,
        })),
      },
    },
  })

  const qc2 = await prisma.qualityCheck.create({
    data: {
      tenantId,
      qcNumber: 'QC-2026-002',
      referenceType: 'INVENTORY',
      referenceId: inventory[0]?.id || 'demo',
      inventoryId: inventory[0]?.id,
      checkType: 'INCOMING',
      inspectionStage: 'PRE_PRODUCTION',
      partNumber: 'RM-001',
      productName: 'Steel Plate 3mm',
      batch: 'BATCH-RM-001',
      quantity: 50,
      unit: 'kg',
      status: 'FAILED',
      passQuantity: 45,
      failQuantity: 5,
      reworkQuantity: 0,
      scrapQuantity: 5,
      defectCode: 'SCRATCH',
      defectDescription: 'Surface scratches on incoming material',
      defectCategory: 'COSMETIC',
      customerApprovalRequired: false,
      completedAt: new Date(),
      checkItems: {
        create: [
          {
            tenantId,
            criteriaCode: 'VIS-001',
            criteriaName: 'Surface Condition',
            category: 'VISUAL',
            checkMethod: 'VISUAL',
            result: 'FAIL',
            defectCode: 'SCRATCH',
            defectSeverity: 'MAJOR',
            defectNotes: 'Multiple scratches on surface',
            order: 0,
          },
          {
            tenantId,
            criteriaCode: 'DIM-001',
            criteriaName: 'Thickness Check',
            category: 'DIMENSIONAL',
            checkMethod: 'MEASURE',
            specification: '3.0 ± 0.1 mm',
            minValue: 2.9,
            maxValue: 3.1,
            unit: 'mm',
            actualValue: 3.05,
            result: 'PASS',
            order: 1,
          },
        ],
      },
    },
  })

  // Create Rework Order for QC-2026-002
  await prisma.reworkOrder.create({
    data: {
      tenantId,
      reworkNumber: 'RW-2026-001',
      qualityCheckId: qc2.id,
      reworkType: 'REWORK',
      priority: 'MEDIUM',
      partNumber: 'RM-001',
      productName: 'Steel Plate 3mm',
      batch: 'BATCH-RM-001',
      quantity: 5,
      unit: 'kg',
      defectCode: 'SCRATCH',
      defectDescription: 'Surface scratches requiring rework',
      rootCause: 'Improper handling during transport',
      instructions: '1. Clean surface\n2. Sand affected areas\n3. Apply protective coating',
      estimatedCost: 150000,
      estimatedHours: 2,
      status: 'PENDING',
    },
  })

  // Create another QC for customer approval flow
  const qc3 = await prisma.qualityCheck.create({
    data: {
      tenantId,
      qcNumber: 'QC-2026-003',
      referenceType: 'ORDER',
      referenceId: orders[0]?.id || 'demo',
      orderId: orders[0]?.id,
      checkType: 'CUSTOMER',
      inspectionStage: 'PRE_SHIPMENT',
      partNumber: 'FG-002',
      productName: 'Custom Machined Part',
      batch: 'BATCH-2026-002',
      quantity: 50,
      unit: 'pcs',
      status: 'PASSED',
      passQuantity: 50,
      failQuantity: 0,
      customerApprovalRequired: true,
      customerApproved: false,
      completedAt: new Date(),
    },
  })

  console.log(`Created QC inspections: ${qc1.qcNumber}, ${qc2.qcNumber}, ${qc3.qcNumber}`)
  console.log('Quality Control demo data seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
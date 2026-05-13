// Seed script for Vendor/Contract Manufacturing demo data
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🏭 Seeding Vendor/Contract Manufacturing demo...')

  // Get existing users
  const adminUser = await prisma.user.findFirst({ where: { tenantId: TENANT_ID, email: 'admin@ypti.com' } })

  // Create Contract Manufacturers
  console.log('🏭 Creating vendors...')
  
  const vendors = [
    {
      code: 'V-001',
      name: 'PT Jaya CNC Indonesia',
      supplierType: 'CONTRACT_MANUFACTURER',
      vendorTier: 'TIER_1',
      contactPerson: 'Budi Santoso',
      email: 'budi@jayacnc.com',
      phone: '+62 21 5551234',
      address: 'Jl. Industri No. 123',
      city: 'Jakarta',
      country: 'Indonesia',
      capabilities: ['CNC Milling', 'CNC Turning', '5-Axis Machining', 'Wire Cut'],
      certifications: 'ISO 9001:2015, IATF 16949',
      leadTimeDays: 14,
      moq: 100,
      paymentTerms: 'NET30',
      qualityRating: 4.5,
      deliveryRating: 4.2,
      priceRating: 3.8,
      onTimeDelivery: 92,
    },
    {
      code: 'V-002',
      name: 'PT Moldindo Prima',
      supplierType: 'CONTRACT_MANUFACTURER',
      vendorTier: 'TIER_1',
      contactPerson: 'Siti Rahayu',
      email: 'siti@moldindo.com',
      phone: '+62 21 5555678',
      address: 'Jl. Pabrik No. 45',
      city: 'Bekasi',
      country: 'Indonesia',
      capabilities: ['Injection Molding', 'Blow Molding', 'Thermoforming', 'Die Casting'],
      certifications: 'ISO 9001:2015, ISO 14001',
      leadTimeDays: 21,
      moq: 500,
      paymentTerms: 'NET45',
      qualityRating: 4.3,
      deliveryRating: 4.0,
      priceRating: 4.2,
      onTimeDelivery: 88,
    },
    {
      code: 'V-003',
      name: 'PT Sumber Logam Jaya',
      supplierType: 'MATERIAL',
      vendorTier: 'TIER_2',
      contactPerson: 'Ahmad Wijaya',
      email: 'ahmad@sumberlogam.com',
      phone: '+62 21 5559012',
      address: 'Jl. Logam No. 78',
      city: 'Tangerang',
      country: 'Indonesia',
      capabilities: ['Steel Supply', 'Aluminum Supply', 'Stainless Steel'],
      certifications: 'ISO 9001:2015',
      leadTimeDays: 7,
      moq: 10,
      paymentTerms: 'NET15',
      qualityRating: 4.0,
      deliveryRating: 4.5,
      priceRating: 4.0,
      onTimeDelivery: 95,
    },
  ]

  for (const vendor of vendors) {
    await prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: vendor.code } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        ...vendor,
        capabilities: JSON.stringify(vendor.capabilities),
      },
    })
  }

  // Create a sample Vendor Order (outsourced manufacturing)
  console.log('📦 Creating sample vendor order...')
  
  const v1 = await prisma.supplier.findFirst({ where: { tenantId: TENANT_ID, code: 'V-001' } })
  const mo = await prisma.manufacturingOrder.findFirst({ where: { tenantId: TENANT_ID } })
  const order = await prisma.order.findFirst({ where: { tenantId: TENANT_ID } })

  if (v1 && mo) {
    const vendorOrder = await prisma.vendorOrder.upsert({
      where: { tenantId_vendorOrderId: { tenantId: TENANT_ID, vendorOrderId: 'VO-2026-001' } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        vendorOrderId: 'VO-2026-001',
        vendorId: v1.id,
        orderId: order?.id,
        moId: mo.id,
        title: 'CNC Machining for Bracket Assembly',
        description: 'Outsourced CNC machining operations for bracket components',
        referenceNumber: order?.orderNumber,
        outsourceType: 'PARTIAL',
        workDescription: 'CNC milling and turning for aluminum bracket components',
        quantity: 50,
        unit: 'pcs',
        unitPrice: 150000,
        totalPrice: 7500000,
        currency: 'IDR',
        paymentTerms: 'NET30',
        promisedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        vendorLeadTimeDays: 14,
        status: 'ORDERED',
        qualityRequired: true,
        notes: 'Urgent order for production line',
      },
    })

    // Update MO with vendor info
    await prisma.manufacturingOrder.update({
      where: { id: mo.id },
      data: {
        isOutsourced: true,
        outsourcedType: 'PARTIAL',
        vendorId: v1.id,
        vendorOrderNumber: 'VO-2026-001',
        vendorEstimatedCost: 7500000,
        vendorLeadTimeDays: 14,
      },
    })

    // Create vendor order items
    await prisma.vendorOrderItem.create({
      data: {
        tenantId: TENANT_ID,
        vendorOrderId: vendorOrder.id,
        partNumber: 'BRK-ALU-001',
        name: 'Aluminum Bracket Main',
        quantity: 50,
        unit: 'pcs',
        unitPrice: 90000,
        totalPrice: 4500000,
        qcRequired: true,
      },
    })

    await prisma.vendorOrderItem.create({
      data: {
        tenantId: TENANT_ID,
        vendorOrderId: vendorOrder.id,
        partNumber: 'BRK-ALU-002',
        name: 'Aluminum Bracket Support',
        quantity: 50,
        unit: 'pcs',
        unitPrice: 60000,
        totalPrice: 3000000,
        qcRequired: true,
      },
    })
  }

  console.log('✅ Vendor/Contract Manufacturing seeded successfully!')
  console.log('\n📋 Summary:')
  console.log('   - 3 Vendors created (1 CNC, 1 Injection Molding, 1 Material)')
  console.log('   - 1 Vendor Order for outsourced manufacturing')
  console.log('   - MO updated with vendor assignment')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
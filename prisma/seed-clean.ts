/**
 * Complete Database Cleanup and Reseed Script
 * Numbering Format:
 * - Orders: ORD-YYMMDD-XXXXX
 * - Manufacturing Orders: MO-YYMMDD-XXXXX
 * - Jobsheets: JS-YYMMDD-XXXXX
 * - Tasks: MT-YYMMDD-XXXXX
 * 
 * Run with: bun run db:seed-clean
 */

import { PrismaClient, OrderStatus, MOStatus, JobsheetStatus, TaskStatus, MachineStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Generate unique ID with date format
const generateId = (prefix: string, seq: number) => {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(-2)
  const mm = (now.getMonth() + 1).toString().padStart(2, '0')
  const dd = now.getDate().toString().padStart(2, '0')
  return `${prefix}-${yy}${mm}${dd}-${seq.toString().padStart(5, '0')}`
}

async function main() {
  console.log('🧹 Cleaning up existing data...')
  
  // Delete in correct order (foreign key constraints)
  await prisma.machiningTask.deleteMany({})
  console.log('  ✓ Deleted all tasks')
  
  await prisma.jobsheet.deleteMany({})
  console.log('  ✓ Deleted all jobsheets')
  
  await prisma.manufacturingOrder.deleteMany({})
  console.log('  ✓ Deleted all MOs')
  
  await prisma.order.deleteMany({})
  console.log('  ✓ Deleted all orders')
  
  console.log('\n🌱 Seeding fresh data with new numbering format...\n')

  // Get machines and users for assignment
  const machines = await prisma.machine.findMany({
    select: { id: true, code: true, name: true },
  })
  
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  })

  let orderSeq = 1
  let moSeq = 1
  let jsSeq = 1
  let taskSeq = 1

  // Sample customers
  const customers = [
    { name: 'PT. Astra Honda Motor', email: 'procurement@ahm.co.id', phone: '+622112345678' },
    { name: 'PT. Yamaha Indonesia Motor', email: 'parts@yamaha.co.id', phone: '+622198765432' },
    { name: 'PT. Suzuki Indomobil Motor', email: 'manufacturing@suzuki.co.id', phone: '+6221555666777' },
    { name: 'PT. Kawasaki Motor Indonesia', email: 'production@kawasaki.co.id', phone: '+6221444555666' },
    { name: 'PT. Toyota Astra Motor', email: 'parts@toyota.co.id', phone: '+6221333222111' },
  ]

  // Create 5 Orders
  for (const customer of customers) {
    const orderNumber = generateId('ORD', orderSeq++)
    console.log(`📦 Creating ${orderNumber} - ${customer.name}`)

    const order = await prisma.order.create({
      data: {
        tenantId: 'tenant_ypti',
        boardId: 'board_main',
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        notes: `Manufacturing order for ${customer.name}`,
        status: OrderStatus.DRAFT,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        progressPercent: 0,
      },
    })

    // Create 1-2 MOs per order
    const moCount = Math.floor(Math.random() * 2) + 1
    for (let i = 0; i < moCount; i++) {
      const moNumber = generateId('MO', moSeq++)
      const moName = getMOName(i, customer.name)
      
      console.log(`  🏭 Creating ${moNumber} - ${moName}`)

      const mo = await prisma.manufacturingOrder.create({
        data: {
          tenantId: 'tenant_ypti',
          orderId: order.id,
          moNumber,
          name: moName,
          description: `Production batch ${i + 1}`,
          status: MOStatus.PLANNED,
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          progressPercent: 0,
        },
      })

      // Create 2-3 Jobsheets per MO
      const jsCount = Math.floor(Math.random() * 2) + 2
      for (let j = 0; j < jsCount; j++) {
        const jsNumber = generateId('JS', jsSeq++)
        const jsName = getJSName(j, moName)
        
        console.log(`    📋 Creating ${jsNumber} - ${jsName}`)

        const jobsheet = await prisma.jobsheet.create({
          data: {
            tenantId: 'tenant_ypti',
            moId: mo.id,
            jsNumber,
            name: jsName,
            description: `Operation ${j + 1} for ${moName}`,
            status: JobsheetStatus.PREPARING,
            plannedStartDate: new Date(),
            plannedEndDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
            progressPercent: 0,
            // Add sample CAM drawing URL
            drawingUrl: 'https://mdpi-res.com/mathematics/mathematics-07-01026/article_deploy/html/images/mathematics-07-01026-g001.png',
          },
        })

        // Create 2-4 Tasks per Jobsheet
        const taskCount = Math.floor(Math.random() * 3) + 2
        for (let k = 0; k < taskCount; k++) {
          const taskNumber = generateId('MT', taskSeq++)
          const taskName = getTaskName(k, jsName)
          const machine = machines[Math.floor(Math.random() * machines.length)]
          const user = users[Math.floor(Math.random() * users.length)]
          
          console.log(`      ⚙️  Creating ${taskNumber} - ${taskName}`)

          await prisma.machiningTask.create({
            data: {
              tenantId: 'tenant_ypti',
              jobsheetId: jobsheet.id,
              taskNumber,
              name: taskName,
              description: `Machining operation ${k + 1}`,
              status: TaskStatus.PENDING,
              plannedHours: parseFloat((Math.random() * 8 + 2).toFixed(1)),
              progressPercent: 0,
              machineId: machine.id,
              assignedTo: user.id,
            },
          })
        }
      }
    }

    console.log('') // Empty line between orders
  }

  console.log('✅ Seeding completed!\n')

  // Show summary
  const totalOrders = await prisma.order.count()
  const totalMOs = await prisma.manufacturingOrder.count()
  const totalJobsheets = await prisma.jobsheet.count()
  const totalTasks = await prisma.machiningTask.count()

  console.log('📊 Summary:')
  console.log(`   - Orders: ${totalOrders}`)
  console.log(`   - Manufacturing Orders: ${totalMOs}`)
  console.log(`   - Jobsheets: ${totalJobsheets}`)
  console.log(`   - Machining Tasks: ${totalTasks}`)
  console.log('\n🔢 Numbering Format:')
  console.log('   - Orders: ORD-YYMMDD-XXXXX')
  console.log('   - MOs: MO-YYMMDD-XXXXX')
  console.log('   - Jobsheets: JS-YYMMDD-XXXXX')
  console.log('   - Tasks: MT-YYMMDD-XXXXX')
}

// Helper functions for generating names
function getMOName(index: number, customer: string) {
  const names = [
    'Frame Assembly',
    'Mounting Bracket',
    'Suspension Arm',
    'Engine Bracket',
    'Swingarm',
  ]
  return `${names[index % names.length]} - ${customer.split(' ')[0]}`
}

function getJSName(index: number, moName: string) {
  const operations = [
    'CNC Milling',
    'Drilling & Tapping',
    'Welding Assembly',
    'Heat Treatment',
    'Quality Inspection',
  ]
  return `${operations[index % operations.length]} - ${moName.split(' - ')[0]}`
}

function getTaskName(index: number, jsName: string) {
  const tasks = [
    'Setup & Fixturing',
    'Rough Machining',
    'Finish Machining',
    'Precision Drilling',
    'Surface Finishing',
    'Final Inspection',
  ]
  return `${tasks[index % tasks.length]}`
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

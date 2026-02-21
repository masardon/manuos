/**
 * Seed script to add Jobsheets and Tasks to existing MOs
 * Run with: bun run db:seed-mo
 */

import { PrismaClient, JobsheetStatus, TaskStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Jobsheets and Tasks for existing MOs...')

  // Get all existing MOs
  const mos = await prisma.manufacturingOrder.findMany({
    include: {
      order: true,
    },
  })

  console.log(`Found ${mos.length} MOs to seed`)

  for (const mo of mos) {
    console.log(`\n📦 Processing ${mo.moNumber} - ${mo.name}`)

    // Check if MO already has jobsheets
    const existingJobsheets = await prisma.jobsheet.count({
      where: { moId: mo.id },
    })

    if (existingJobsheets > 0) {
      console.log(`  ⏭️  Already has ${existingJobsheets} jobsheets, skipping...`)
      continue
    }

    // Create sample jobsheets based on MO
    const jobsheetsData = getJobsheetsForMO(mo)

    for (const jsData of jobsheetsData) {
      console.log(`  📋 Creating ${jsData.jsNumber}...`)

      const jobsheet = await prisma.jobsheet.create({
        data: {
          tenantId: mo.tenantId,
          moId: mo.id,
          jsNumber: jsData.jsNumber,
          name: jsData.name,
          description: jsData.description,
          status: JobsheetStatus.PREPARING,
          plannedStartDate: new Date(jsData.plannedStartDate),
          plannedEndDate: new Date(jsData.plannedEndDate),
          progressPercent: 0,
        },
      })

      // Create tasks for this jobsheet
      console.log(`    ⚙️  Creating ${jsData.tasks.length} tasks...`)
      for (const taskData of jsData.tasks) {
        await prisma.machiningTask.create({
          data: {
            tenantId: mo.tenantId,
            jobsheetId: jobsheet.id,
            taskNumber: taskData.taskNumber,
            name: taskData.name,
            description: taskData.description,
            status: TaskStatus.PENDING,
            plannedHours: taskData.plannedHours,
            progressPercent: 0,
            machineId: taskData.machineId || null,
            assignedTo: taskData.assignedTo || null,
          },
        })
      }
    }

    console.log(`  ✅ Created ${jobsheetsData.length} jobsheets with tasks`)
  }

  console.log('\n✅ Seeding completed!')

  // Show summary
  const totalMOs = await prisma.manufacturingOrder.count()
  const totalJobsheets = await prisma.jobsheet.count()
  const totalTasks = await prisma.machiningTask.count()

  console.log('\n📊 Summary:')
  console.log(`   - Manufacturing Orders: ${totalMOs}`)
  console.log(`   - Jobsheets: ${totalJobsheets}`)
  console.log(`   - Machining Tasks: ${totalTasks}`)
}

// Helper function to get jobsheets based on MO type
function getJobsheetsForMO(mo: any) {
  const orderDate = mo.plannedStartDate || new Date()
  const addDays = (days: number) => {
    const date = new Date(orderDate)
    date.setDate(date.getDate() + days)
    return date.toISOString()
  }

  // Get machines for assignment
  const machines = [
    { code: 'CNC-001', id: 'machine-cnc-001' },
    { code: 'CNC-002', id: 'machine-cnc-002' },
    { code: 'DRILL-001', id: 'machine-drill-001' },
    { code: 'WELD-001', id: 'machine-weld-001' },
  ]

  // Get technicians
  const technicians = [
    { id: 'user-tech1', name: 'Andi' },
    { id: 'user-tech2', name: 'Dewi' },
  ]

  // Create different jobsheets based on MO name
  if (mo.name.includes('Frame')) {
    return [
      {
        jsNumber: `JS-001`,
        name: 'CNC Milling - Frame Mount',
        description: 'Precision milling of frame mounting surfaces',
        plannedStartDate: addDays(0),
        plannedEndDate: addDays(5),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'Rough Milling Operation',
            description: 'Initial material removal',
            plannedHours: 4,
            machineId: machines[0].id,
            assignedTo: technicians[0].id,
          },
          {
            taskNumber: `T-02`,
            name: 'Finish Milling Operation',
            description: 'Final surface finishing',
            plannedHours: 3,
            machineId: machines[0].id,
            assignedTo: technicians[0].id,
          },
        ],
      },
      {
        jsNumber: `JS-002`,
        name: 'Drilling & Tapping',
        description: 'Drill mounting holes and tap threads',
        plannedStartDate: addDays(6),
        plannedEndDate: addDays(8),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'Drill Mounting Holes',
            description: 'Drill 8x M8 mounting holes',
            plannedHours: 2,
            machineId: machines[2].id,
            assignedTo: technicians[1].id,
          },
          {
            taskNumber: `T-02`,
            name: 'Tap Threads M8',
            description: 'Tap threads for mounting bolts',
            plannedHours: 1.5,
            machineId: machines[2].id,
            assignedTo: technicians[1].id,
          },
        ],
      },
      {
        jsNumber: `JS-003`,
        name: 'Welding Assembly',
        description: 'Weld frame components together',
        plannedStartDate: addDays(9),
        plannedEndDate: addDays(12),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'TIG Welding - Main Joint',
            description: 'Main structural weld',
            plannedHours: 6,
            machineId: machines[3].id,
            assignedTo: technicians[0].id,
          },
        ],
      },
    ]
  } else if (mo.name.includes('Bracket')) {
    return [
      {
        jsNumber: `JS-001`,
        name: 'CNC Machining - Bracket',
        description: 'Complete bracket machining',
        plannedStartDate: addDays(0),
        plannedEndDate: addDays(4),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'Face Milling',
            description: 'Mill top and bottom surfaces',
            plannedHours: 2.5,
            machineId: machines[0].id,
            assignedTo: technicians[0].id,
          },
          {
            taskNumber: `T-02`,
            name: 'Pocket Milling',
            description: 'Mill internal pockets',
            plannedHours: 3,
            machineId: machines[0].id,
            assignedTo: technicians[0].id,
          },
          {
            taskNumber: `T-03`,
            name: 'Hole Drilling',
            description: 'Drill mounting holes',
            plannedHours: 1.5,
            machineId: machines[2].id,
            assignedTo: technicians[1].id,
          },
        ],
      },
      {
        jsNumber: `JS-002`,
        name: 'Deburring & Finishing',
        description: 'Remove burrs and apply finish',
        plannedStartDate: addDays(5),
        plannedEndDate: addDays(6),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'Deburring',
            description: 'Remove all sharp edges',
            plannedHours: 2,
            machineId: null,
            assignedTo: technicians[1].id,
          },
        ],
      },
    ]
  } else if (mo.name.includes('Suspension')) {
    return [
      {
        jsNumber: `JS-001`,
        name: 'CNC Lathe - Tube Turning',
        description: 'Turn suspension tube OD and ID',
        plannedStartDate: addDays(0),
        plannedEndDate: addDays(6),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'OD Turning Operation',
            description: 'Turn outer diameter to final size',
            plannedHours: 5,
            machineId: machines[1].id,
            assignedTo: technicians[1].id,
          },
          {
            taskNumber: `T-02`,
            name: 'ID Boring',
            description: 'Bore inner diameter',
            plannedHours: 4,
            machineId: machines[1].id,
            assignedTo: technicians[1].id,
          },
          {
            taskNumber: `T-03`,
            name: 'Grooving',
            description: 'Cut sealing grooves',
            plannedHours: 2,
            machineId: machines[1].id,
            assignedTo: technicians[1].id,
          },
        ],
      },
      {
        jsNumber: `JS-002`,
        name: 'Heat Treatment',
        description: 'Harden and temper',
        plannedStartDate: addDays(7),
        plannedEndDate: addDays(9),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'Quenching',
            description: 'Heat treat to 45 HRC',
            plannedHours: 3,
            machineId: null,
            assignedTo: null,
          },
        ],
      },
    ]
  } else {
    // Default jobsheets for other MOs
    return [
      {
        jsNumber: `JS-001`,
        name: 'Primary Machining',
        description: 'Main machining operations',
        plannedStartDate: addDays(0),
        plannedEndDate: addDays(5),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'Setup & Fixturing',
            description: 'Prepare machine and fixtures',
            plannedHours: 2,
            machineId: machines[0].id,
            assignedTo: technicians[0].id,
          },
          {
            taskNumber: `T-02`,
            name: 'Rough Machining',
            description: 'Remove bulk material',
            plannedHours: 4,
            machineId: machines[0].id,
            assignedTo: technicians[0].id,
          },
          {
            taskNumber: `T-03`,
            name: 'Finish Machining',
            description: 'Final dimensions and surface',
            plannedHours: 3,
            machineId: machines[0].id,
            assignedTo: technicians[0].id,
          },
        ],
      },
      {
        jsNumber: `JS-002`,
        name: 'Secondary Operations',
        description: 'Drilling, tapping, deburring',
        plannedStartDate: addDays(6),
        plannedEndDate: addDays(8),
        tasks: [
          {
            taskNumber: `T-01`,
            name: 'Drilling',
            description: 'Drill holes per drawing',
            plannedHours: 2,
            machineId: machines[2].id,
            assignedTo: technicians[1].id,
          },
          {
            taskNumber: `T-02`,
            name: 'Deburring',
            description: 'Remove all burrs',
            plannedHours: 1.5,
            machineId: null,
            assignedTo: technicians[1].id,
          },
        ],
      },
    ]
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

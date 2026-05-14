/**
 * Create tasks for MO-2026-003 so the MO-level dependency has an effect
 */

import { PrismaClient, JobsheetStatus, TaskStatus, MachineStatus } from '@prisma/client'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🔧 Creating tasks for MO-2026-003...\n')

  // Get MO-2026-003
  const mo = await prisma.manufacturingOrder.findFirst({
    where: { 
      tenantId: TENANT_ID, 
      moNumber: 'MO-2026-003'
    }
  })

  if (!mo) {
    console.log('❌ MO-2026-003 not found')
    return
  }

  console.log(`Found MO-2026-003: ${mo.name}`)

  // Check if jobsheet already exists
  const existingJs = await prisma.jobsheet.findFirst({
    where: { 
      tenantId: TENANT_ID, 
      moId: mo.id
    }
  })

  if (existingJs) {
    console.log(`⚠️  Jobsheet ${existingJs.jsNumber} already exists`)
    console.log('Skipping creation...')
    return
  }

  // Create a jobsheet for MO-2026-003
  const js = await prisma.jobsheet.create({
    data: {
      tenantId: TENANT_ID,
      moId: mo.id,
      jsNumber: 'JS-2026-003',
      name: 'Aluminum Bracket Machining',
      status: JobsheetStatus.PLANNED,
      plannedStartDate: addDays(new Date(), 7), // Start 7 days from now
      plannedEndDate: addDays(new Date(), 14), // End 14 days from now
    }
  })

  console.log(`✅ Created jobsheet: ${js.jsNumber} - ${js.name}`)

  // Get machines
  const cncMachine = await prisma.machine.findFirst({ where: { code: 'CNC-002' } })
  const drillMachine = await prisma.machine.findFirst({ where: { code: 'DRILL-001' } })
  const tech2 = await prisma.user.findFirst({ where: { email: 'tech2@ypti.com' } })

  // Create tasks for the jobsheet
  const tasks = [
    {
      taskNumber: 'MT-2026-004',
      name: 'Material Preparation',
      status: TaskStatus.PLANNED,
      plannedHours: 2,
      machineId: null,
      assignedTo: tech2?.id,
      progressPercent: 0,
    },
    {
      taskNumber: 'MT-2026-005',
      name: 'CNC Bracket Machining',
      status: TaskStatus.PLANNED,
      plannedHours: 8,
      machineId: cncMachine?.id,
      assignedTo: tech2?.id,
      progressPercent: 0,
    },
    {
      taskNumber: 'MT-2026-006',
      name: 'Drilling & Tapping',
      status: TaskStatus.PLANNED,
      plannedHours: 4,
      machineId: drillMachine?.id,
      assignedTo: tech2?.id,
      progressPercent: 0,
    },
  ]

  for (const taskData of tasks) {
    const task = await prisma.machiningTask.create({
      data: {
        tenantId: TENANT_ID,
        jobsheetId: js.id,
        ...taskData,
      }
    })
    console.log(`✅ Created task: ${task.taskNumber} - ${task.name}`)
  }

  console.log('\n=====================================================')
  console.log('✅ MO-2026-003 TASKS CREATED SUCCESSFULLY!')
  console.log('=====================================================')
  console.log('\n📋 Summary:')
  console.log(`   - Jobsheet: ${js.jsNumber}`)
  console.log(`   - Tasks created: ${tasks.length}`)
  console.log('\n🎯 Next steps:')
  console.log('   1. Go to http://localhost:3000/planning/gantt')
  console.log('   2. Click "Auto-Schedule Tasks"')
  console.log('   3. MO-2026-003 tasks should be scheduled 10 days after MO-2026-001')
  console.log('=====================================================')
}

main()
  .catch((e) => {
    console.error('❌ FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
/**
 * Test MO-level dependency scheduling
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🔍 Testing MO-level dependency scheduling...\n')

  // Get the MO-level dependency
  const dependency = await prisma.taskDependency.findFirst({
    where: { 
      tenantId: TENANT_ID, 
      isActive: true,
      predecessorMoId: { not: null },
      successorMoId: { not: null }
    },
    include: {
      predecessorMO: true,
      successorMO: true
    }
  })

  if (!dependency) {
    console.log('❌ No MO-level dependency found')
    return
  }

  console.log(`Found MO-level dependency:`)
  console.log(`  ${dependency.predecessorMO?.moNumber} → ${dependency.successorMO?.moNumber}`)
  console.log(`  Type: ${dependency.dependencyType}`)
  console.log(`  Lag: ${dependency.lagDays} days\n`)

  // Get all tasks in both MOs
  const tasks = await prisma.machiningTask.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      jobsheet: {
        include: {
          manufacturingOrder: true
        }
      }
    }
  })

  const predTasks = tasks.filter(t => t.jobsheet?.manufacturingOrder?.id === dependency.predecessorMoId)
  const succTasks = tasks.filter(t => t.jobsheet?.manufacturingOrder?.id === dependency.successorMoId)

  console.log(`Predecessor MO (${dependency.predecessorMO?.moNumber}) tasks:`)
  for (const task of predTasks) {
    console.log(`  - ${task.taskNumber}: ${task.name}`)
    console.log(`    Planned: ${task.plannedStartDate?.toISOString().split('T')[0] || 'N/A'} → ${task.plannedEndDate?.toISOString().split('T')[0] || 'N/A'}`)
  }

  console.log(`\nSuccessor MO (${dependency.successorMO?.moNumber}) tasks:`)
  for (const task of succTasks) {
    console.log(`  - ${task.taskNumber}: ${task.name}`)
    console.log(`    Planned: ${task.plannedStartDate?.toISOString().split('T')[0] || 'N/A'} → ${task.plannedEndDate?.toISOString().split('T')[0] || 'N/A'}`)
  }

  // Simulate what the execution plan API would do
  console.log('\n📋 Simulating execution plan calculation...')
  
  // Find the last task in predecessor MO
  const lastPredTask = predTasks.reduce((latest, task) => {
    if (!task.plannedEndDate) return latest
    if (!latest || !latest.plannedEndDate) return task
    return task.plannedEndDate > latest.plannedEndDate ? task : latest
  }, predTasks[0])

  // Find the first task in successor MO
  const firstSuccTask = succTasks.reduce((earliest, task) => {
    if (!task.plannedStartDate) return earliest
    if (!earliest || !earliest.plannedStartDate) return task
    return task.plannedStartDate < earliest.plannedStartDate ? task : earliest
  }, succTasks[0])

  if (lastPredTask && firstSuccTask) {
    const predEnd = lastPredTask.plannedEndDate || new Date()
    const succStart = firstSuccTask.plannedStartDate || new Date()
    
    console.log(`\nDependency analysis:`)
    console.log(`  Last predecessor task: ${lastPredTask.taskNumber}`)
    console.log(`    Ends: ${predEnd.toISOString().split('T')[0]}`)
    console.log(`  First successor task: ${firstSuccTask.taskNumber}`)
    console.log(`    Starts: ${succStart.toISOString().split('T')[0]}`)
    
    // Calculate expected start date for successor
    const expectedStart = new Date(predEnd)
    expectedStart.setDate(expectedStart.getDate() + dependency.lagDays)
    
    console.log(`\nExpected schedule:`)
    console.log(`  Successor should start on: ${expectedStart.toISOString().split('T')[0]}`)
    console.log(`  Current start date: ${succStart.toISOString().split('T')[0]}`)
    
    const daysDiff = Math.round((succStart.getTime() - expectedStart.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff === 0) {
      console.log(`  ✅ Schedule is correct!`)
    } else if (daysDiff > 0) {
      console.log(`  ⚠️  Successor starts ${daysDiff} days late`)
    } else {
      console.log(`  ⚠️  Successor starts ${Math.abs(daysDiff)} days early`)
    }
  }

  console.log('\n=====================================================')
  console.log('✅ MO-LEVEL DEPENDENCY TEST COMPLETED')
  console.log('=====================================================')
}

main()
  .catch((e) => {
    console.error('❌ TEST FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
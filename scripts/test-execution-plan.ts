/**
 * Test the execution plan API logic for MO-level dependencies
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🔍 Testing execution plan logic for MO-level dependencies...\n')

  // Get all dependencies
  const dependencies = await prisma.taskDependency.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    include: {
      predecessorMO: true,
      successorMO: true,
    }
  })

  console.log(`Found ${dependencies.length} dependencies`)

  // Get all tasks with their jobsheets and MOs
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

  console.log(`Found ${tasks.length} tasks\n`)

  // Simulate the execution plan API logic
  for (const dep of dependencies) {
    console.log(`\nDependency: ${dep.predecessorMO?.moNumber} → ${dep.successorMO?.moNumber}`)
    console.log(`  Type: ${dep.dependencyType}`)
    console.log(`  Lag: ${dep.lagDays} days`)

    if (dep.predecessorMoId && dep.successorMoId) {
      const predTasks = tasks.filter(t => t.jobsheet?.manufacturingOrder?.id === dep.predecessorMoId)
      const succTasks = tasks.filter(t => t.jobsheet?.manufacturingOrder?.id === dep.successorMoId)

      console.log(`\n  Predecessor tasks: ${predTasks.length}`)
      for (const task of predTasks) {
        console.log(`    - ${task.taskNumber}: ${task.name}`)
        console.log(`      Planned: ${task.plannedStartDate?.toISOString().split('T')[0] || 'N/A'} → ${task.plannedEndDate?.toISOString().split('T')[0] || 'N/A'}`)
      }

      console.log(`\n  Successor tasks: ${succTasks.length}`)
      for (const task of succTasks) {
        console.log(`    - ${task.taskNumber}: ${task.name}`)
        console.log(`      Planned: ${task.plannedStartDate?.toISOString().split('T')[0] || 'N/A'} → ${task.plannedEndDate?.toISOString().split('T')[0] || 'N/A'}`)
      }

      // Find the last task in predecessor MO
      const lastPredTask = predTasks.reduce((latest, task) => {
        if (!task.plannedEndDate) return latest
        if (!latest || !latest.plannedEndDate) return task
        return task.plannedEndDate > latest.plannedEndDate ? task : latest
      }, predTasks[0])

      if (lastPredTask) {
        console.log(`\n  Last predecessor task: ${lastPredTask.taskNumber}`)
        console.log(`    Ends: ${lastPredTask.plannedEndDate?.toISOString().split('T')[0] || 'N/A'}`)

        // Calculate expected start for successor tasks
        if (lastPredTask.plannedEndDate) {
          const expectedStart = new Date(lastPredTask.plannedEndDate)
          expectedStart.setDate(expectedStart.getDate() + dep.lagDays)
          console.log(`  Expected successor start (with ${dep.lagDays}d lag): ${expectedStart.toISOString().split('T')[0]}`)
        }
      }
    }
  }

  console.log('\n=====================================================')
  console.log('✅ EXECUTION PLAN LOGIC TEST COMPLETED')
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
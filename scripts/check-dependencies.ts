/**
 * Check current dependencies in the database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🔍 Checking dependencies in database...\n')

  // Get all dependencies
  const dependencies = await prisma.taskDependency.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      predecessorTask: true,
      successorTask: true,
      predecessorMO: true,
      successorMO: true,
      predecessorJobsheet: true,
      successorJobsheet: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  console.log(`Found ${dependencies.length} dependencies:\n`)

  for (const dep of dependencies) {
    console.log(`Dependency: ${dep.id}`)
    console.log(`  Type: ${dep.dependencyType}`)
    console.log(`  Lag: ${dep.lagDays} days`)
    console.log(`  Active: ${dep.isActive}`)
    console.log(`  Notes: ${dep.notes || 'N/A'}`)
    console.log(`  Created: ${dep.createdAt}`)
    
    // Predecessor info
    if (dep.predecessorTask) {
      console.log(`  Predecessor Task: ${dep.predecessorTask.taskNumber} - ${dep.predecessorTask.name}`)
    }
    if (dep.predecessorMO) {
      console.log(`  Predecessor MO: ${dep.predecessorMO.moNumber} - ${dep.predecessorMO.name}`)
    }
    if (dep.predecessorJobsheet) {
      console.log(`  Predecessor Jobsheet: ${dep.predecessorJobsheet.jsNumber} - ${dep.predecessorJobsheet.name}`)
    }
    
    // Successor info
    if (dep.successorTask) {
      console.log(`  Successor Task: ${dep.successorTask.taskNumber} - ${dep.successorTask.name}`)
    }
    if (dep.successorMO) {
      console.log(`  Successor MO: ${dep.successorMO.moNumber} - ${dep.successorMO.name}`)
    }
    if (dep.successorJobsheet) {
      console.log(`  Successor Jobsheet: ${dep.successorJobsheet.jsNumber} - ${dep.successorJobsheet.name}`)
    }
    
    console.log('')
  }

  // Get all MOs
  const mos = await prisma.manufacturingOrder.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      jobsheets: {
        include: {
          tasks: true
        }
      }
    }
  })

  console.log(`\n📋 Manufacturing Orders:\n`)
  for (const mo of mos) {
    console.log(`${mo.moNumber} - ${mo.name}`)
    console.log(`  Status: ${mo.status}`)
    console.log(`  Jobsheets: ${mo.jobsheets.length}`)
    for (const js of mo.jobsheets) {
      console.log(`    - ${js.jsNumber}: ${js.tasks.length} tasks`)
    }
    console.log('')
  }
}

main()
  .catch((e) => {
    console.error('❌ CHECK FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
/**
 * Check what tasks exist in each MO
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🔍 Checking MO tasks...\n')

  // Get all MOs with their jobsheets and tasks
  const mos = await prisma.manufacturingOrder.findMany({
    where: { tenantId: TENANT_ID },
    include: {
      jobsheets: {
        include: {
          machiningTasks: true
        }
      }
    }
  })

  for (const mo of mos) {
    console.log(`${mo.moNumber} - ${mo.name}`)
    console.log(`  Status: ${mo.status}`)
    console.log(`  Jobsheets: ${mo.jobsheets.length}`)
    
    for (const js of mo.jobsheets) {
      console.log(`    - ${js.jsNumber}: ${js.machiningTasks.length} tasks`)
      for (const task of js.machiningTasks) {
        console.log(`      * ${task.taskNumber}: ${task.name}`)
        console.log(`        Planned: ${task.plannedStartDate?.toISOString().split('T')[0] || 'N/A'} → ${task.plannedEndDate?.toISOString().split('T')[0] || 'N/A'}`)
      }
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
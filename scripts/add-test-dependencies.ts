/**
 * Add test dependencies between tasks for auto-schedule testing
 * 
 * Dependencies to create:
 * 1. MT-2026-001 → MT-2026-002 (FINISH_TO_START, 0 lag)
 * 2. MT-2026-002 → MT-2026-003 (FINISH_TO_START, +10 days lag)
 * 
 * Run with: bun run scripts/add-test-dependencies.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🔗 Adding test dependencies for auto-schedule testing...\n')

  // Find tasks
  const task1 = await prisma.machiningTask.findFirst({
    where: { tenantId: TENANT_ID, taskNumber: 'MT-2026-001' }
  })

  const task2 = await prisma.machiningTask.findFirst({
    where: { tenantId: TENANT_ID, taskNumber: 'MT-2026-002' }
  })

  const task3 = await prisma.machiningTask.findFirst({
    where: { tenantId: TENANT_ID, taskNumber: 'MT-2026-003' }
  })

  if (!task1 || !task2 || !task3) {
    console.error('❌ Could not find all tasks. Please run seed first.')
    console.log('   Found tasks:', { task1: !!task1, task2: !!task2, task3: !!task3 })
    process.exit(1)
  }

  console.log('✅ Found tasks:')
  console.log(`   - ${task1.taskNumber}: ${task1.name} (${task1.id})`)
  console.log(`   - ${task2.taskNumber}: ${task2.name} (${task2.id})`)
  console.log(`   - ${task3.taskNumber}: ${task3.name} (${task3.id})`)

  // Check for existing dependencies
  const existingDeps = await prisma.taskDependency.findMany({
    where: { tenantId: TENANT_ID, isActive: true }
  })

  if (existingDeps.length > 0) {
    console.log(`\n⚠️  Found ${existingDeps.length} existing dependencies. Deleting them first...`)
    await prisma.taskDependency.deleteMany({
      where: { tenantId: TENANT_ID }
    })
    console.log('✅ Cleared existing dependencies')
  }

  // Create dependency 1: MT-2026-001 → MT-2026-002 (FS, 0 lag)
  console.log('\n📝 Creating dependency 1: MT-2026-001 → MT-2026-002 (Finish-to-Start, 0 days lag)')
  const dep1 = await prisma.taskDependency.create({
    data: {
      tenantId: TENANT_ID,
      predecessorTaskId: task1.id,
      successorTaskId: task2.id,
      dependencyType: 'FINISH_TO_START',
      lagDays: 0,
      notes: 'Setup must complete before CNC milling can start',
    }
  })
  console.log(`✅ Created dependency: ${dep1.id}`)

  // Create dependency 2: MT-2026-002 → MT-2026-003 (FS, +10 days lag)
  console.log('\n📝 Creating dependency 2: MT-2026-002 → MT-2026-003 (Finish-to-Start, +10 days lag)')
  const dep2 = await prisma.taskDependency.create({
    data: {
      tenantId: TENANT_ID,
      predecessorTaskId: task2.id,
      successorTaskId: task3.id,
      dependencyType: 'FINISH_TO_START',
      lagDays: 10,
      notes: 'CNC milling must complete + 10 days before bearing assembly can start',
    }
  })
  console.log(`✅ Created dependency: ${dep2.id}`)

  console.log('\n=====================================================')
  console.log('✅ TEST DEPENDENCIES CREATED SUCCESSFULLY!')
  console.log('=====================================================')
  console.log('\n📊 DEPENDENCY SUMMARY:')
  console.log(`   1. ${task1.taskNumber} → ${task2.taskNumber} (FS, 0 days)`)
  console.log(`   2. ${task2.taskNumber} → ${task3.taskNumber} (FS, +10 days)`)
  console.log('\n🎯 NEXT STEPS:')
  console.log('   1. Run: npm run dev')
  console.log('   2. Go to: http://localhost:3000/planning/gantt')
  console.log('   3. Click "Auto-Schedule Tasks" button')
  console.log('   4. Verify that MT-2026-003 is scheduled 10 days after MT-2026-002')
  console.log('=====================================================')
}

main()
  .catch((e) => {
    console.error('❌ FAILED TO CREATE DEPENDENCIES:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
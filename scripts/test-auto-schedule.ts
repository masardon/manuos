/**
 * Test Auto-Schedule functionality
 * 
 * This script tests the Critical Path Method (CPM) scheduling
 * by calculating optimal dates based on dependencies.
 * 
 * Run with: bun run scripts/test-auto-schedule.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'

interface TaskInfo {
  id: string
  taskNumber: string
  name: string
  startDate: Date
  endDate: Date
  duration: number // in days
  predecessors: string[]
}

async function main() {
  console.log('📊 Testing Auto-Schedule (CPM)...\n')

  // Get all tasks with dependencies
  const dependencies = await prisma.taskDependency.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    include: {
      predecessorTask: true,
      successorTask: true,
    }
  })

  console.log(`✅ Found ${dependencies.length} active dependencies`)
  
  // Get all tasks
  const tasks = await prisma.machiningTask.findMany({
    where: { tenantId: TENANT_ID }
  })

  console.log(`✅ Found ${tasks.length} tasks`)

  // Build task info map
  const taskMap = new Map<string, TaskInfo>()
  
  for (const task of tasks) {
    const startDate = task.plannedStartDate || task.createdAt
    const endDate = task.plannedEndDate || task.createdAt
    const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    taskMap.set(task.id, {
      id: task.id,
      taskNumber: task.taskNumber,
      name: task.name,
      startDate,
      endDate,
      duration,
      predecessors: []
    })
  }

  // Add predecessors to tasks
  for (const dep of dependencies) {
    if (dep.predecessorTaskId && dep.successorTaskId) {
      const successor = taskMap.get(dep.successorTaskId)
      if (successor) {
        successor.predecessors.push(dep.predecessorTaskId)
      }
    }
  }

  // Topological sort (Kahn's algorithm)
  const sortedTasks: string[] = []
  const inDegree = new Map<string, number>()
  
  // Calculate in-degree for each task
  for (const [taskId] of taskMap) {
    inDegree.set(taskId, 0)
  }
  
  for (const [taskId, task] of taskMap) {
    for (const predId of task.predecessors) {
      inDegree.set(taskId, (inDegree.get(taskId) || 0) + 1)
    }
  }
  
  // Queue for tasks with no predecessors
  const queue: string[] = []
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId)
    }
  }
  
  // Process queue
  while (queue.length > 0) {
    const currentId = queue.shift()!
    sortedTasks.push(currentId)
    
    const currentTask = taskMap.get(currentId)!
    
    // Find all successors
    for (const [taskId, task] of taskMap) {
      if (task.predecessors.includes(currentId)) {
        const newDegree = (inDegree.get(taskId) || 1) - 1
        inDegree.set(taskId, newDegree)
        
        if (newDegree === 0) {
          queue.push(taskId)
        }
      }
    }
  }
  
  // Check for cycles
  if (sortedTasks.length !== taskMap.size) {
    console.error('❌ Cycle detected in dependencies!')
    process.exit(1)
  }

  console.log('\n📋 Topological order (for scheduling):')
  for (const taskId of sortedTasks) {
    const task = taskMap.get(taskId)!
    console.log(`   - ${task.taskNumber}: ${task.name}`)
  }

  // Forward pass - calculate earliest start/finish dates
  const earliestStart = new Map<string, Date>()
  const earliestFinish = new Map<string, Date>()
  
  for (const taskId of sortedTasks) {
    const task = taskMap.get(taskId)!
    let maxPredFinish = task.startDate // Default to original start date
    
    // Find the maximum finish date of all predecessors
    for (const predId of task.predecessors) {
      const predFinish = earliestFinish.get(predId) || taskMap.get(predId)!.endDate
      if (predFinish.getTime() > maxPredFinish.getTime()) {
        maxPredFinish = predFinish
      }
    }
    
    // Add lag for dependencies
    const relevantDeps = dependencies.filter(d => d.successorTaskId === taskId)
    let maxLag = 0
    for (const dep of relevantDeps) {
      if (dep.lagDays > maxLag) {
        maxLag = dep.lagDays
      }
    }
    
    const startDate = new Date(maxPredFinish)
    startDate.setDate(startDate.getDate() + maxLag)
    
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + task.duration)
    
    earliestStart.set(taskId, startDate)
    earliestFinish.set(taskId, endDate)
  }

  console.log('\n📅 Calculated Schedule (Forward Pass):')
  for (const taskId of sortedTasks) {
    const task = taskMap.get(taskId)!
    const start = earliestStart.get(taskId)!
    const finish = earliestFinish.get(taskId)!
    console.log(`   - ${task.taskNumber}: ${start.toISOString().split('T')[0]} → ${finish.toISOString().split('T')[0]} (${task.duration} days)`)
  }

  // Update tasks with new dates
  console.log('\n💾 Updating tasks with new scheduled dates...')
  
  for (const taskId of sortedTasks) {
    const task = taskMap.get(taskId)!
    const newStart = earliestStart.get(taskId)!
    const newFinish = earliestFinish.get(taskId)!
    
    await prisma.machiningTask.update({
      where: { id: taskId },
      data: {
        plannedStartDate: newStart,
        plannedEndDate: newFinish,
      }
    })
    
    console.log(`   ✅ Updated ${task.taskNumber}: ${newStart.toISOString().split('T')[0]} → ${newFinish.toISOString().split('T')[0]}`)
  }

  console.log('\n=====================================================')
  console.log('✅ AUTO-SCHEDULE TEST COMPLETED SUCCESSFULLY!')
  console.log('=====================================================')
  console.log('\n📊 SCHEDULE SUMMARY:')
  console.log(`   - Tasks scheduled: ${sortedTasks.length}`)
  console.log(`   - Dependencies respected: ${dependencies.length}`)
  
  // Calculate project duration
  const projectStart = new Date(Math.min(...Array.from(earliestStart.values()).map(d => d.getTime())))
  const projectEnd = new Date(Math.max(...Array.from(earliestFinish.values()).map(d => d.getTime())))
  const projectDuration = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24))
  
  console.log(`   - Project start: ${projectStart.toISOString().split('T')[0]}`)
  console.log(`   - Project end: ${projectEnd.toISOString().split('T')[0]}`)
  console.log(`   - Total duration: ${projectDuration} days`)
  
  console.log('\n🎯 NEXT STEPS:')
  console.log('   1. Run: npm run dev')
  console.log('   2. Go to: http://localhost:3000/planning/gantt')
  console.log('   3. Verify the scheduled dates are correct')
  console.log('   4. Check that dependency arrows show MT-2026-003 starts 10 days after MT-2026-002')
  console.log('=====================================================')
}

main()
  .catch((e) => {
    console.error('❌ AUTO-SCHEDULE TEST FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
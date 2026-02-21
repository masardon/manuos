import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// Calculate progress for a jobsheet based on its tasks
async function calculateJobsheetProgress(jobsheetId: string) {
  const tasks = await db.machiningTask.findMany({
    where: { jobsheetId },
    select: { progressPercent: true, plannedHours: true },
  })

  if (tasks.length === 0) return 0

  const totalPlannedHours = tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0)
  if (totalPlannedHours === 0) {
    return Math.round(tasks.reduce((sum, t) => sum + t.progressPercent, 0) / tasks.length)
  }

  const weightedProgress = tasks.reduce(
    (sum, t) => sum + (t.progressPercent * (t.plannedHours || 0)),
    0
  )
  return Math.round(weightedProgress / totalPlannedHours)
}

// Calculate progress for an MO based on its jobsheets
async function calculateMOProgress(moId: string) {
  const jobsheets = await db.jobsheet.findMany({
    where: { moId },
    select: { progressPercent: true },
  })

  if (jobsheets.length === 0) return 0
  return Math.round(jobsheets.reduce((sum, js) => sum + js.progressPercent, 0) / jobsheets.length)
}

// Calculate progress for an Order based on its MOs
async function calculateOrderProgress(orderId: string) {
  const mos = await db.manufacturingOrder.findMany({
    where: { orderId },
    select: { progressPercent: true },
  })

  if (mos.length === 0) return 0
  return Math.round(mos.reduce((sum, mo) => sum + mo.progressPercent, 0) / mos.length)
}

// POST /api/tasks/[id]/clock - Clock in/out/pause of task
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    const task = await db.machiningTask.findUnique({
      where: { id },
      include: {
        jobsheet: {
          include: {
            manufacturingOrder: {
              include: {
                order: true,
              },
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const now = new Date()

    if (action === 'clock_in') {
      await db.machiningTask.update({
        where: { id },
        data: {
          clockedInAt: now,
          clockedOutAt: null, // Clear clockedOutAt when clocking in
          status: 'RUNNING', // Update status to RUNNING when clocking in
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Clocked in successfully',
        clockedInAt: now.toISOString(),
      })
    } else if (action === 'clock_out') {
      // Calculate actual hours
      const actualHours = task.clockedInAt
        ? parseFloat(((now.getTime() - new Date(task.clockedInAt).getTime()) / (1000 * 60 * 60)).toFixed(2))
        : task.actualHours

      await db.machiningTask.update({
        where: { id },
        data: {
          clockedOutAt: now,
          actualHours,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Clocked out successfully',
        clockedOutAt: now.toISOString(),
        actualHours,
      })
    } else if (action === 'pause') {
      // Pause the task - keep clockedInAt but change status to PAUSED
      await db.machiningTask.update({
        where: { id },
        data: {
          status: 'PAUSED',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Task paused',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating task clock:', error)
    return NextResponse.json(
      { error: 'Failed to update task clock' },
      { status: 500 }
    )
  }
}

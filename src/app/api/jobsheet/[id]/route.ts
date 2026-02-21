import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/jobsheet/[id] - Get jobsheet details with tasks
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const jobsheet = await db.jobsheet.findUnique({
      where: { id },
      include: {
        machiningTasks: {
          include: {
            machine: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            taskNumber: 'asc',
          },
        },
        manufacturingOrder: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerName: true,
                status: true,
                progressPercent: true,
              },
            },
          },
        },
      },
    })

    if (!jobsheet) {
      return NextResponse.json(
        { error: 'Jobsheet not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      jobsheet: {
        ...jobsheet,
        plannedStartDate: jobsheet.plannedStartDate?.toISOString() || null,
        plannedEndDate: jobsheet.plannedEndDate?.toISOString() || null,
        actualStartDate: jobsheet.actualStartDate?.toISOString() || null,
        actualEndDate: jobsheet.actualEndDate?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('Error fetching jobsheet details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobsheet details' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/mo/[id] - Get MO details with jobsheets and tasks
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const mo = await db.manufacturingOrder.findUnique({
      where: { id },
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
        jobsheets: {
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
          },
          orderBy: {
            jsNumber: 'asc',
          },
        },
      },
    })

    if (!mo) {
      return NextResponse.json(
        { error: 'MO not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      mo: {
        ...mo,
        plannedStartDate: mo.plannedStartDate?.toISOString() || null,
        plannedEndDate: mo.plannedEndDate?.toISOString() || null,
        actualStartDate: mo.actualStartDate?.toISOString() || null,
        actualEndDate: mo.actualEndDate?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('Error fetching MO details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MO details' },
      { status: 500 }
    )
  }
}

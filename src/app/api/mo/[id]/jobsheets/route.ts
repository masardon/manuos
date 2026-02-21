import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { JobsheetStatus } from '@prisma/client'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/mo/[id]/jobsheets - Create a new jobsheet
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      jsNumber,
      name,
      description,
      plannedStartDate,
      plannedEndDate,
    } = body

    // Get MO to get tenant info
    const mo = await db.manufacturingOrder.findUnique({
      where: { id },
    })

    if (!mo) {
      return NextResponse.json(
        { error: 'MO not found' },
        { status: 404 }
      )
    }

    const jobsheet = await db.jobsheet.create({
      data: {
        tenantId: mo.tenantId,
        moId: id,
        jsNumber,
        name,
        description: description || null,
        status: JobsheetStatus.PREPARING,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        progressPercent: 0,
      },
    })

    return NextResponse.json({
      success: true,
      jobsheet,
      message: 'Jobsheet created successfully',
    })
  } catch (error) {
    console.error('Error creating jobsheet:', error)
    return NextResponse.json(
      { error: 'Failed to create jobsheet' },
      { status: 500 }
    )
  }
}

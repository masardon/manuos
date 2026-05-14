import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { JobsheetStatus, TaskStatus } from '@prisma/client'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/mo/[id]/jobsheets - Create a new jobsheet with material allocation
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
      drawingUrl,
      allocateMaterials,
      allocationType,
    } = body

    // Get MO to get tenant info and check for materials
    const mo = await db.manufacturingOrder.findUnique({
      where: { id },
      include: {
        materialRequirements: {
          where: {
            status: { in: ['RESERVED', 'PARTIALLY_RESERVED'] }
          }
        }
      }
    })

    if (!mo) {
      return NextResponse.json(
        { error: 'MO not found' },
        { status: 404 }
      )
    }

    // Create jobsheet
    const jobsheet = await db.jobsheet.create({
      data: {
        tenantId: mo.tenantId,
        moId: id,
        jsNumber,
        name,
        description: description || null,
        drawingUrl: drawingUrl || null,
        status: JobsheetStatus.PREPARING,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        progressPercent: 0,
      },
    })

    // Allocate materials if requested
    let allocationResult = null
    if (allocateMaterials && mo.materialRequirements.length > 0) {
      allocationResult = await allocateMaterialsToJobsheet(
        mo.tenantId,
        id,
        jobsheet.id,
        mo.materialRequirements,
        allocationType || 'equal'
      )
    }

    return NextResponse.json({
      success: true,
      jobsheet,
      allocation: allocationResult,
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

// Helper function to allocate materials to jobsheet
async function allocateMaterialsToJobsheet(
  tenantId: string,
  moId: string,
  jobsheetId: string,
  materials: any[],
  allocationType: string
) {
  const allocationResults = []
  let allocatedCount = 0

  // Count existing jobsheets to calculate distribution
  const existingJobsheets = await db.jobsheet.count({
    where: { moId, tenantId }
  })
  const totalJobsheets = existingJobsheets + 1 // Include the one being created

  for (const material of materials) {
    // Calculate allocation quantity based on type
    let allocatedQty = 0
    if (allocationType === 'equal') {
      // Equal distribution among all jobsheets
      allocatedQty = material.reservedQty / totalJobsheets
    } else if (allocationType === 'manual') {
      // For manual, allocate 0 initially (user will allocate manually)
      allocatedQty = 0
    }
    // For 'none', don't allocate anything

    if (allocatedQty > 0) {
      // Create material allocation record
      const allocation = await db.jobsheetMaterial.create({
        data: {
          tenantId,
          jobsheetId,
          materialRequirementId: material.id,
          partNumber: material.partNumber,
          name: material.name,
          allocatedQty,
          availableQty: 0, // Will be updated when tasks are assigned
          consumedQty: 0,
          unit: material.unit,
          status: 'ALLOCATED',
        },
      })

      // Update material requirement reserved quantity
      await db.materialRequirement.update({
        where: { id: material.id },
        data: {
          reservedQty: { decrement: allocatedQty }
        }
      })

      allocationResults.push({
        materialId: material.id,
        partNumber: material.partNumber,
        allocatedQty,
      })
      allocatedCount++
    }
  }

  return {
    success: true,
    allocatedCount,
    allocations: allocationResults,
  }
}

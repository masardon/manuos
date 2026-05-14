import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEMO_TENANT_ID = 'tenant_ypti'

// GET /api/production-output/tasks - Get all tasks with recipe output info
export async function GET(request: NextRequest) {
  try {
    const tasks = await db.machiningTask.findMany({
      where: { 
        tenantId: DEMO_TENANT_ID,
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        machine: {
          select: { code: true, name: true }
        },
        assignedUser: {
          select: { name: true, email: true }
        },
        jobsheet: {
          select: {
            id: true,
            jsNumber: true,
            name: true,
            manufacturingOrder: {
              select: {
                id: true,
                moNumber: true,
                name: true,
                recipe: {
                  select: {
                    outputPartNumber: true,
                    outputName: true,
                    outputQuantity: true,
                    outputUnit: true,
                  }
                }
              }
            }
          }
        },
        materialAllocations: {
          include: {
            jobsheetMaterial: {
              select: {
                partNumber: true,
                name: true,
                unit: true
              }
            }
          }
        },
        productionOutputs: true,
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ],
    })

    // Transform data for frontend
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      taskNumber: task.taskNumber,
      name: task.name,
      status: task.status,
      machineId: task.machineId,
      assignedTo: task.assignedTo,
      clockedInAt: task.clockedInAt?.toISOString() || null,
      clockedOutAt: task.clockedOutAt?.toISOString() || null,
      actualHours: task.actualHours,
      plannedHours: task.plannedHours,
      jobsheet: {
        id: task.jobsheet.id,
        jsNumber: task.jobsheet.jsNumber,
        name: task.jobsheet.name,
        moId: task.jobsheet.manufacturingOrder.id,
        moNumber: task.jobsheet.manufacturingOrder.moNumber,
        moName: task.jobsheet.manufacturingOrder.name,
        recipeOutput: task.jobsheet.manufacturingOrder.recipe ? {
          partNumber: task.jobsheet.manufacturingOrder.recipe.outputPartNumber,
          name: task.jobsheet.manufacturingOrder.recipe.outputName,
          quantity: task.jobsheet.manufacturingOrder.recipe.outputQuantity,
          unit: task.jobsheet.manufacturingOrder.recipe.outputUnit,
        } : null,
      },
      machine: task.machine,
      assignedUser: task.assignedUser,
      materialAllocations: task.materialAllocations.map(ma => ({
        id: ma.id,
        allocatedQty: ma.allocatedQty,
        consumedQty: ma.consumedQty,
        jobsheetMaterial: {
          partNumber: ma.jobsheetMaterial.partNumber,
          name: ma.jobsheetMaterial.name,
          unit: ma.jobsheetMaterial.unit,
        }
      })),
      productionOutputs: task.productionOutputs.map(output => ({
        id: output.id,
        outputNumber: output.outputNumber,
        partNumber: output.partNumber,
        productName: output.productName,
        plannedQty: output.plannedQty,
        actualQty: output.actualQty,
        goodQty: output.goodQty,
        reworkQty: output.reworkQty,
        scrapQty: output.scrapQty,
        status: output.status,
        qcPassed: output.qcPassed,
        batch: output.batch,
        createdAt: output.createdAt.toISOString(),
      })),
    }))

    return NextResponse.json({ tasks: transformedTasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

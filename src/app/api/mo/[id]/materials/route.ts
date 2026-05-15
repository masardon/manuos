import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_TENANT_ID = 'tenant_ypti';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get MO with recipe and material requirements
    const mo = await db.manufacturingOrder.findFirst({
      where: {
        id,
        tenantId: DEMO_TENANT_ID,
      },
      include: {
        order: true,
        recipe: {
          include: {
            ingredients: true,
          },
        },
        materialRequirements: {
          include: {
            jobsheetMaterials: {
              include: {
                taskAllocations: true,
              },
            },
          },
        },
        jobsheets: {
          include: {
            materialAllocations: {
              include: {
                materialRequirement: true,
              },
            },
            machiningTasks: {
              include: {
                machine: true,
                assignedUser: true,
              },
            },
          },
        },
      },
    });

    if (!mo) {
      return NextResponse.json(
        { error: 'Manufacturing order not found' },
        { status: 404 }
      );
    }

    // Get available inventory for each material requirement
    const materialsWithStock = await Promise.all(
      mo.materialRequirements.map(async (req) => {
        const availableStock = await db.inventory.aggregate({
          where: {
            tenantId: DEMO_TENANT_ID,
            partNumber: req.partNumber,
            status: 'AVAILABLE',
            quantity: { gt: 0 },
          },
          _sum: {
            quantity: true,
          },
        });

        const totalAllocated = req.jobsheetMaterials.reduce((sum, jm) => {
          return sum + jm.taskAllocations.reduce((aSum: number, alloc: any) => aSum + alloc.allocatedQty, 0);
        }, 0);

        return {
          ...req,
          availableStock: availableStock._sum.quantity || 0,
          totalAllocated,
          remaining: req.requiredQty - totalAllocated,
        };
      })
    );

    return NextResponse.json({
      mo,
      materials: materialsWithStock,
      requirements: materialsWithStock,
      purchaseRequests: [],
    });
  } catch (error) {
    console.error('Error fetching MO materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

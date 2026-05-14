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
                allocations: true,
              },
            },
          },
        },
        jobsheets: {
          include: {
            materials: {
              include: {
                materialRequirement: true,
                allocations: {
                  include: {
                    inventory: true,
                  },
                },
              },
            },
            tasks: {
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
            currentQuantity: { gt: 0 },
          },
          _sum: {
            currentQuantity: true,
          },
        });

        const totalAllocated = req.jobsheetMaterials.reduce((sum, jm) => {
          return sum + jm.allocations.reduce((aSum, alloc) => aSum + alloc.quantity, 0);
        }, 0);

        return {
          ...req,
          availableStock: availableStock._sum.currentQuantity || 0,
          totalAllocated,
          remaining: req.requiredQuantity - totalAllocated,
        };
      })
    );

    return NextResponse.json({
      mo,
      materials: materialsWithStock,
    });
  } catch (error) {
    console.error('Error fetching MO materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    );
  }
}

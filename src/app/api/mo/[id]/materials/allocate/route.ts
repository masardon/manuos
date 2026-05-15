import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventoryEventEmitter } from '@/lib/events/inventory-events';

const DEMO_TENANT_ID = 'tenant_ypti';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      jobsheetId,
      materialRequirementId,
      inventoryId,
      quantity,
      locationId,
      shelfId,
      userId,
    } = body;

    // Validate required fields
    if (!jobsheetId || !materialRequirementId || !inventoryId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify MO exists
    const mo = await db.manufacturingOrder.findFirst({
      where: {
        id,
        tenantId: DEMO_TENANT_ID,
      },
      include: {
        jobsheets: true,
      },
    });

    if (!mo) {
      return NextResponse.json(
        { error: 'Manufacturing order not found' },
        { status: 404 }
      );
    }

    // Verify jobsheet belongs to this MO
    const jobsheet = mo.jobsheets.find(js => js.id === jobsheetId);
    if (!jobsheet) {
      return NextResponse.json(
        { error: 'Jobsheet not found for this MO' },
        { status: 404 }
      );
    }

    // Verify material requirement exists
    const materialReq = await db.materialRequirement.findFirst({
      where: {
        id: materialRequirementId,
        moId: id,
        tenantId: DEMO_TENANT_ID,
      },
    });

    if (!materialReq) {
      return NextResponse.json(
        { error: 'Material requirement not found' },
        { status: 404 }
      );
    }

    // Verify inventory exists and has sufficient quantity
    const inventory = await db.inventory.findFirst({
      where: {
        id: inventoryId,
        tenantId: DEMO_TENANT_ID,
        status: 'AVAILABLE',
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found or not available' },
        { status: 404 }
      );
    }

    if (inventory.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient inventory quantity' },
        { status: 400 }
      );
    }

    // Verify jobsheet material exists
    const jobsheetMaterial = await db.jobsheetMaterial.findFirst({
      where: {
        jobsheetId,
        materialRequirementId,
        tenantId: DEMO_TENANT_ID,
      },
    });

    if (!jobsheetMaterial) {
      return NextResponse.json(
        { error: 'Jobsheet material not found' },
        { status: 404 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Create material allocation
      const allocation = await tx.taskMaterialAllocation.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          jobsheetMaterialId: jobsheetMaterial.id,
          taskId: body.taskId || jobsheetMaterial.jobsheetId, // Use taskId or fallback to jobsheetId
          allocatedQty: quantity,
          remainingQty: quantity,
          unit: inventory.unit,
          status: 'ALLOCATED',
        },
      });

      // Update inventory quantity (reduce by allocated amount)
      await tx.inventory.update({
        where: { id: inventoryId },
        data: {
          quantity: { decrement: quantity },
        },
      });

      // Create inventory transaction record
      const transactionNumber = `ITX-${Date.now()}`;
      await tx.inventoryTransaction.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          transactionNumber,
          inventoryId,
          type: 'CONSUMPTION',
          quantity: -quantity, // Negative for consumption
          referenceType: 'MATERIAL_ALLOCATION',
          referenceId: allocation.id,
          performedBy: userId || 'system',
          notes: `Allocated to jobsheet ${jobsheet.jsNumber}`,
        },
      });

      // Update jobsheet material status if fully allocated
      const totalAllocated = await tx.taskMaterialAllocation.aggregate({
        where: {
          jobsheetMaterialId: jobsheetMaterial.id,
          status: 'ALLOCATED',
        },
        _sum: { allocatedQty: true },
      });

      const reqMaterial = await tx.materialRequirement.findUnique({
        where: { id: materialRequirementId },
      });

      if ((totalAllocated._sum.allocatedQty || 0) >= (reqMaterial?.requiredQty || 0)) {
        await tx.jobsheetMaterial.update({
          where: { id: jobsheetMaterial.id },
          data: { status: 'FULLY_ALLOCATED' },
        });
      } else {
        await tx.jobsheetMaterial.update({
          where: { id: jobsheetMaterial.id },
          data: { status: 'PARTIALLY_ALLOCATED' },
        });
      }

      // Update material requirement status
      const moMaterials = await tx.jobsheetMaterial.findMany({
        where: {
          materialRequirementId,
        },
        include: {
          taskAllocations: true,
        },
      });

      const totalMoAllocated = moMaterials.reduce((sum, jm) => {
        return sum + jm.taskAllocations.reduce((aSum: number, alloc: any) => aSum + alloc.allocatedQty, 0);
      }, 0);

      if (totalMoAllocated >= (reqMaterial?.requiredQty || 0)) {
        await tx.materialRequirement.update({
          where: { id: materialRequirementId },
          data: { status: 'ALLOCATED' },
        });
      } else if (totalMoAllocated > 0) {
        await tx.materialRequirement.update({
          where: { id: materialRequirementId },
          data: { status: 'PARTIALLY_ALLOCATED' },
        });
      }

      return allocation;
    });

    // Emit inventory update event (inventory variable already declared above for the check)
    if (inventory) {
      inventoryEventEmitter.emitInventoryUpdate({
        inventoryId,
        partNumber: inventory.partNumber,
        previousQuantity: inventory.quantity + quantity,
        newQuantity: inventory.quantity,
        changeType: 'ALLOCATION',
        referenceId: result.id,
        referenceType: 'MATERIAL_ALLOCATION',
        performedBy: userId || 'system',
        tenantId: DEMO_TENANT_ID
      });

      // Emit allocation update event
      inventoryEventEmitter.emitAllocationUpdate({
        allocationId: result.id,
        jobsheetMaterialId: jobsheetMaterial.id,
        inventoryId,
        partNumber: inventory.partNumber,
        quantity,
        status: 'ALLOCATED',
        tenantId: DEMO_TENANT_ID,
        action: 'CREATE'
      });
    }

    return NextResponse.json({
      success: true,
      allocation: result,
    });
  } catch (error) {
    console.error('Error allocating material:', error);
    return NextResponse.json(
      { error: 'Failed to allocate material' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { allocationId, userId } = body;

    if (!allocationId) {
      return NextResponse.json(
        { error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    // Get allocation with jobsheet material details
    const allocation = await db.taskMaterialAllocation.findFirst({
      where: {
        id: allocationId,
        tenantId: DEMO_TENANT_ID,
      },
      include: {
        jobsheetMaterial: {
          include: {
            materialRequirement: {
              include: {
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!allocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    const inventory = allocation.jobsheetMaterial.materialRequirement?.inventory;
    if (!inventory) {
      return NextResponse.json(
        { error: 'No inventory linked to this allocation' },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Return quantity back to inventory
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: { increment: allocation.allocatedQty },
        },
      });

      // Create inventory transaction for return
      const transactionNumber = `ITX-${Date.now()}`;
      await tx.inventoryTransaction.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          transactionNumber,
          inventoryId: inventory.id,
          type: 'RETURN',
          quantity: allocation.allocatedQty,
          referenceType: 'ALLOCATION_CANCELLED',
          referenceId: allocationId,
          performedBy: userId || 'system',
          notes: 'Material allocation cancelled - returned to inventory',
        },
      });

      // Delete the allocation
      await tx.taskMaterialAllocation.delete({
        where: { id: allocationId },
      });

      // Update jobsheet material status
      const remainingAllocations = await tx.taskMaterialAllocation.aggregate({
        where: {
          jobsheetMaterialId: allocation.jobsheetMaterialId,
          status: 'ALLOCATED',
        },
        _sum: { allocatedQty: true },
      });

      const newStatus = (remainingAllocations._sum.allocatedQty || 0) > 0 
        ? 'PARTIALLY_ALLOCATED' 
        : 'PENDING';

      await tx.jobsheetMaterial.update({
        where: { id: allocation.jobsheetMaterialId },
        data: { status: newStatus },
      });

      // Update material requirement status
      const moMaterials = await tx.jobsheetMaterial.findMany({
        where: {
          materialRequirementId: allocation.jobsheetMaterial.materialRequirementId,
        },
        include: {
          taskAllocations: true,
        },
      });

      const totalMoAllocated = moMaterials.reduce((sum, jm) => {
        return sum + jm.taskAllocations.reduce((aSum: number, alloc: any) => aSum + alloc.allocatedQty, 0);
      }, 0);

      const reqMaterial = allocation.jobsheetMaterial.materialRequirement;
      let reqStatus = 'PENDING';
      if (totalMoAllocated >= (reqMaterial?.requiredQty || 0)) {
        reqStatus = 'ALLOCATED';
      } else if (totalMoAllocated > 0) {
        reqStatus = 'PARTIALLY_ALLOCATED';
      }

      await tx.materialRequirement.update({
        where: { id: reqMaterial!.id },
        data: { status: reqStatus },
      });
    });

    // Get updated inventory for event emission
    const updatedInventory = await db.inventory.findUnique({
      where: { id: inventory.id }
    });

    // Emit inventory update event (material returned to inventory)
    if (updatedInventory) {
      inventoryEventEmitter.emitInventoryUpdate({
        inventoryId: inventory.id,
        partNumber: inventory.partNumber,
        previousQuantity: inventory.quantity - allocation.allocatedQty,
        newQuantity: updatedInventory.quantity,
        changeType: 'RETURN',
        referenceId: allocationId,
        referenceType: 'ALLOCATION_CANCELLED',
        performedBy: userId || 'system',
        tenantId: DEMO_TENANT_ID
      });

      // Emit allocation update event (deleted)
      inventoryEventEmitter.emitAllocationUpdate({
        allocationId,
        jobsheetMaterialId: allocation.jobsheetMaterialId,
        inventoryId: inventory.id,
        partNumber: inventory.partNumber,
        quantity: allocation.allocatedQty,
        status: 'CANCELLED',
        tenantId: DEMO_TENANT_ID,
        action: 'DELETE'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Allocation cancelled and material returned to inventory',
    });
  } catch (error) {
    console.error('Error cancelling allocation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel allocation' },
      { status: 500 }
    );
  }
}

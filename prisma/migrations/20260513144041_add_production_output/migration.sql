-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "businessUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT DEFAULT '#gray',
    "icon" TEXT,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "allowSelfAssign" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowState_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromStateId" TEXT NOT NULL,
    "toStateId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "condition" TEXT,
    "allowedRoles" TEXT NOT NULL DEFAULT '',
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "approverRoles" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowTransition_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTransition_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "WorkflowState" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTransition_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "WorkflowState" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "workflowId" TEXT,
    "currentStateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "plannedStartDate" DATETIME,
    "plannedEndDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "progressPercent" REAL NOT NULL DEFAULT 0,
    "drawingUrl" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_currentStateId_fkey" FOREIGN KEY ("currentStateId") REFERENCES "WorkflowState" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManufacturingOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "moNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MAIN',
    "isOutsourced" BOOLEAN NOT NULL DEFAULT false,
    "outsourcedType" TEXT,
    "vendorId" TEXT,
    "vendorOrderNumber" TEXT,
    "vendorQuoteNumber" TEXT,
    "vendorEstimatedCost" REAL,
    "vendorActualCost" REAL,
    "vendorLeadTimeDays" INTEGER,
    "vendorNotes" TEXT,
    "workflowId" TEXT,
    "currentStateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "plannedStartDate" DATETIME,
    "plannedEndDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "progressPercent" REAL NOT NULL DEFAULT 0,
    "recipeId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManufacturingOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ManufacturingOrder_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManufacturingOrder_currentStateId_fkey" FOREIGN KEY ("currentStateId") REFERENCES "WorkflowState" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManufacturingOrder_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ManufacturingOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jobsheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "moId" TEXT NOT NULL,
    "jsNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SINGLE_PART',
    "preparedBy" TEXT,
    "checkedBy" TEXT,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PREPARING',
    "dependsOn" TEXT,
    "plannedStartDate" DATETIME,
    "plannedEndDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "progressPercent" REAL NOT NULL DEFAULT 0,
    "drawingUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Jobsheet_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MachiningTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "jobsheetId" TEXT NOT NULL,
    "taskNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "machineId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "plannedHours" REAL,
    "actualHours" REAL,
    "clockedInAt" DATETIME,
    "clockedOutAt" DATETIME,
    "breakdownAt" DATETIME,
    "breakdownNote" TEXT,
    "resolvedAt" DATETIME,
    "assignedTo" TEXT,
    "progressPercent" REAL NOT NULL DEFAULT 0,
    "dependsOn" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MachiningTask_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MachiningTask_jobsheetId_fkey" FOREIGN KEY ("jobsheetId") REFERENCES "Jobsheet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MachiningTask_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionOutput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "outputNumber" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "jobsheetId" TEXT NOT NULL,
    "moId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "batch" TEXT,
    "plannedQty" REAL NOT NULL,
    "actualQty" REAL NOT NULL,
    "goodQty" REAL NOT NULL DEFAULT 0,
    "reworkQty" REAL NOT NULL DEFAULT 0,
    "scrapQty" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "materialConsumed" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "qcPassed" BOOLEAN NOT NULL DEFAULT false,
    "qcCheckedAt" DATETIME,
    "qcCheckedBy" TEXT,
    "qcNotes" TEXT,
    "outputLocationId" TEXT,
    "outputShelfId" TEXT,
    "notes" TEXT,
    "defectNotes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionOutput_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MachiningTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionOutput_jobsheetId_fkey" FOREIGN KEY ("jobsheetId") REFERENCES "Jobsheet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionOutput_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionOutput_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductionOutput_outputLocationId_fkey" FOREIGN KEY ("outputLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOutput_outputShelfId_fkey" FOREIGN KEY ("outputShelfId") REFERENCES "Shelf" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ProductionOutput_qcCheckedBy_fkey" FOREIGN KEY ("qcCheckedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobsheetMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "jobsheetId" TEXT NOT NULL,
    "materialRequirementId" TEXT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allocatedQty" REAL NOT NULL,
    "availableQty" REAL NOT NULL DEFAULT 0,
    "consumedQty" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "sourceBatch" TEXT,
    "sourceShelf" TEXT,
    "sourceLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "notes" TEXT,
    "allocatedBy" TEXT,
    "allocatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobsheetMaterial_jobsheetId_fkey" FOREIGN KEY ("jobsheetId") REFERENCES "Jobsheet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobsheetMaterial_materialRequirementId_fkey" FOREIGN KEY ("materialRequirementId") REFERENCES "MaterialRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskMaterialAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "jobsheetMaterialId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "allocatedQty" REAL NOT NULL,
    "consumedQty" REAL NOT NULL DEFAULT 0,
    "wastedQty" REAL NOT NULL DEFAULT 0,
    "remainingQty" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "consumedAt" DATETIME,
    "consumedBy" TEXT,
    "wasteReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskMaterialAllocation_jobsheetMaterialId_fkey" FOREIGN KEY ("jobsheetMaterialId") REFERENCES "JobsheetMaterial" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskMaterialAllocation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MachiningTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "location" TEXT,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "capacity" REAL,
    "lastMaintenanceAt" DATETIME,
    "nextMaintenanceAt" DATETIME,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Breakdown" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'MECHANICAL',
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "affectedTaskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Breakdown_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "moId" TEXT NOT NULL,
    "recipeIngredientId" TEXT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "requiredQty" REAL NOT NULL,
    "reservedQty" REAL NOT NULL DEFAULT 0,
    "requestedQty" REAL NOT NULL DEFAULT 0,
    "receivedQty" REAL NOT NULL DEFAULT 0,
    "consumedQty" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "requiredDate" DATETIME NOT NULL,
    "plannedOrderId" TEXT,
    "unit" TEXT,
    "specifications" TEXT,
    "inventoryId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialRequirement_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequirement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialRequirement_recipeIngredientId_fkey" FOREIGN KEY ("recipeIngredientId") REFERENCES "RecipeIngredient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "prNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "sourceType" TEXT NOT NULL,
    "sourceMoId" TEXT,
    "sourceReference" TEXT,
    "supplierId" TEXT,
    "suggestedSupplier" TEXT,
    "requiredDate" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "preparedBy" TEXT,
    "approvedBy" TEXT,
    "odooPrId" TEXT,
    "odooSyncedAt" DATETIME,
    "linkedPoId" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "estimatedAmount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseRequestItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "materialRequirementId" TEXT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inventoryId" TEXT,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "supplierId" TEXT,
    "supplierPartNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "receivedQty" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseRequestItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseRequestItem_materialRequirementId_fkey" FOREIGN KEY ("materialRequirementId") REFERENCES "MaterialRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseRequestItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseRequestItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "supplierType" TEXT NOT NULL DEFAULT 'MATERIAL',
    "vendorTier" TEXT,
    "capabilities" TEXT,
    "certifications" TEXT,
    "leadTimeDays" INTEGER,
    "moq" INTEGER,
    "paymentTerms" TEXT,
    "currency" TEXT DEFAULT 'IDR',
    "creditLimit" REAL,
    "qualityRating" REAL DEFAULT 5.0,
    "deliveryRating" REAL DEFAULT 5.0,
    "priceRating" REAL DEFAULT 5.0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "onTimeDelivery" REAL DEFAULT 100,
    "odooPartnerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VendorOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "vendorOrderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "orderId" TEXT,
    "moId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "referenceNumber" TEXT,
    "vendorQuoteNumber" TEXT,
    "outsourceType" TEXT NOT NULL DEFAULT 'FULL',
    "workDescription" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "paymentTerms" TEXT,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promisedDate" DATETIME,
    "actualDeliveryDate" DATETIME,
    "vendorLeadTimeDays" INTEGER,
    "daysRemaining" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "qualityRequired" BOOLEAN NOT NULL DEFAULT true,
    "qualityPassed" BOOLEAN,
    "qcNotes" TEXT,
    "shippingMethod" TEXT,
    "shippingCost" REAL,
    "trackingNumber" TEXT,
    "poDocument" TEXT,
    "packingList" TEXT,
    "certificate" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VendorOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VendorOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VendorOrder_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "vendorOrderId" TEXT NOT NULL,
    "materialId" TEXT,
    "inventoryId" TEXT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "receivedQty" REAL NOT NULL DEFAULT 0,
    "acceptedQty" REAL NOT NULL DEFAULT 0,
    "rejectedQty" REAL NOT NULL DEFAULT 0,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "qcRequired" BOOLEAN NOT NULL DEFAULT true,
    "qcPassed" BOOLEAN,
    "defectCode" TEXT,
    "defectNotes" TEXT,
    "batchNumber" TEXT,
    "lotNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorOrderItem_vendorOrderId_fkey" FOREIGN KEY ("vendorOrderId") REFERENCES "VendorOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VendorOrderItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorShipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "vendorOrderId" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "shipmentType" TEXT NOT NULL,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SHIPPED',
    "shippedDate" DATETIME NOT NULL,
    "expectedDate" DATETIME,
    "receivedDate" DATETIME,
    "inspectedBy" TEXT,
    "inspectionResult" TEXT,
    "inspectionNotes" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VendorShipment_vendorOrderId_fkey" FOREIGN KEY ("vendorOrderId") REFERENCES "VendorOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VendorInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "vendorOrderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balanceDue" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" DATETIME,
    "paymentMethod" TEXT,
    "paymentRef" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VendorInvoice_vendorOrderId_fkey" FOREIGN KEY ("vendorOrderId") REFERENCES "VendorOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'WAREHOUSE',
    "parentLocationId" TEXT,
    "capacity" INTEGER,
    "area" REAL,
    "picUserId" TEXT,
    "building" TEXT,
    "floor" TEXT,
    "zone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Location_parentLocationId_fkey" FOREIGN KEY ("parentLocationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Location_picUserId_fkey" FOREIGN KEY ("picUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shelf" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "row" TEXT,
    "column" TEXT,
    "level" TEXT,
    "capacity" INTEGER,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shelf_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialHandoff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "handoffNumber" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "handedBy" TEXT NOT NULL,
    "receivedBy" TEXT,
    "fromPicUserId" TEXT,
    "toPicUserId" TEXT,
    "handoffType" TEXT NOT NULL DEFAULT 'STOCK_TRANSFER',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "moId" TEXT,
    "jobsheetId" TEXT,
    "taskId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handedAt" DATETIME,
    "receivedAt" DATETIME,
    "notes" TEXT,
    "deliveryNote" TEXT,
    "trackingNumber" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialHandoff_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoff_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoff_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoff_jobsheetId_fkey" FOREIGN KEY ("jobsheetId") REFERENCES "Jobsheet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoff_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "MachiningTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoff_handedBy_fkey" FOREIGN KEY ("handedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoff_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoff_fromPicUserId_fkey" FOREIGN KEY ("fromPicUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoff_toPicUserId_fkey" FOREIGN KEY ("toPicUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialHandoffItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "handoffId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "materialRequirementId" TEXT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "fromBatch" TEXT,
    "toBatch" TEXT,
    "fromShelf" TEXT,
    "toShelf" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "inspectedBy" TEXT,
    "inspectedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialHandoffItem_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "MaterialHandoff" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoffItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaterialHandoffItem_materialRequirementId_fkey" FOREIGN KEY ("materialRequirementId") REFERENCES "MaterialRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "batch" TEXT,
    "quantity" REAL NOT NULL DEFAULT 0,
    "reservedQty" REAL NOT NULL DEFAULT 0,
    "availableQty" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "locationId" TEXT,
    "shelfId" TEXT,
    "location" TEXT,
    "shelf" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "currentProcess" TEXT,
    "supplierId" TEXT,
    "supplierRef" TEXT,
    "unitPrice" REAL,
    "currency" TEXT DEFAULT 'IDR',
    "reorderPoint" REAL,
    "reorderQuantity" REAL,
    "receivedAt" DATETIME,
    "expiryDate" DATETIME,
    "manufactureDate" DATETIME,
    "lotNumber" TEXT,
    "currentMoId" TEXT,
    "currentJobsheetId" TEXT,
    "currentTaskId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inventory_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "Shelf" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "orderId" TEXT,
    "moId" TEXT,
    "materialRequirementId" TEXT,
    "quantity" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "reservedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" DATETIME,
    "consumedAt" DATETIME,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryReservation_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryReservation_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryReservation_materialRequirementId_fkey" FOREIGN KEY ("materialRequirementId") REFERENCES "MaterialRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "fromBatch" TEXT,
    "toBatch" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "purchaseOrderId" TEXT,
    "orderId" TEXT,
    "moId" TEXT,
    "productionOutputId" TEXT,
    "handoffStatus" TEXT,
    "expectedDate" DATETIME,
    "actualDate" DATETIME,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_productionOutputId_fkey" FOREIGN KEY ("productionOutputId") REFERENCES "ProductionOutput" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATETIME,
    "receivedDate" DATETIME,
    "odooPoId" TEXT,
    "odooSyncedAt" DATETIME,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "receivedQty" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrderItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "category" TEXT,
    "outputPartNumber" TEXT NOT NULL,
    "outputName" TEXT NOT NULL,
    "outputQuantity" REAL NOT NULL DEFAULT 1,
    "outputUnit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentRecipeId" TEXT,
    CONSTRAINT "Recipe_parentRecipeId_fkey" FOREIGN KEY ("parentRecipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "mixOrder" INTEGER NOT NULL DEFAULT 0,
    "mixPercentage" REAL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "wastePercentage" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "roleId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "employeeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "taskReminders" BOOLEAN NOT NULL DEFAULT true,
    "breakdownAlerts" BOOLEAN NOT NULL DEFAULT true,
    "inventoryAlerts" BOOLEAN NOT NULL DEFAULT true,
    "defaultView" TEXT NOT NULL DEFAULT 'dashboard',
    "showInactiveMachines" BOOLEAN NOT NULL DEFAULT false,
    "showCompletedTasks" BOOLEAN NOT NULL DEFAULT false,
    "rowsPerPage" INTEGER NOT NULL DEFAULT 25,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QualityCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "qcNumber" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "orderId" TEXT,
    "moId" TEXT,
    "inventoryId" TEXT,
    "handoffId" TEXT,
    "checkType" TEXT NOT NULL,
    "inspectionStage" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "batch" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "passQuantity" REAL NOT NULL DEFAULT 0,
    "failQuantity" REAL NOT NULL DEFAULT 0,
    "reworkQuantity" REAL NOT NULL DEFAULT 0,
    "scrapQuantity" REAL NOT NULL DEFAULT 0,
    "defectCode" TEXT,
    "defectDescription" TEXT,
    "defectCategory" TEXT,
    "inspectorId" TEXT,
    "inspectedAt" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "reworkRequired" BOOLEAN NOT NULL DEFAULT false,
    "customerApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
    "customerApproved" BOOLEAN NOT NULL DEFAULT false,
    "customerApprovedAt" DATETIME,
    "customerApprovedBy" TEXT,
    "notes" TEXT,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QualityCheck_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityCheck_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityCheck_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityCheck_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "MaterialHandoff" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityCheck_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityCheckItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "qualityCheckId" TEXT NOT NULL,
    "criteriaCode" TEXT NOT NULL,
    "criteriaName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "checkMethod" TEXT,
    "specification" TEXT,
    "minValue" REAL,
    "maxValue" REAL,
    "targetValue" REAL,
    "unit" TEXT,
    "actualValue" REAL,
    "actualText" TEXT,
    "result" TEXT NOT NULL,
    "defectCode" TEXT,
    "defectSeverity" TEXT,
    "defectNotes" TEXT,
    "measurements" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QualityCheckItem_qualityCheckId_fkey" FOREIGN KEY ("qualityCheckId") REFERENCES "QualityCheck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReworkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "reworkNumber" TEXT NOT NULL,
    "qualityCheckId" TEXT NOT NULL,
    "orderId" TEXT,
    "moId" TEXT,
    "inventoryId" TEXT,
    "reworkType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "partNumber" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "batch" TEXT,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "defectCode" TEXT,
    "defectDescription" TEXT NOT NULL,
    "rootCause" TEXT,
    "instructions" TEXT,
    "requiredMaterials" TEXT,
    "estimatedCost" REAL,
    "estimatedHours" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completionPercentage" REAL NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "assignedAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "resultQuantity" REAL,
    "scrapQuantity" REAL,
    "resultNotes" TEXT,
    "requiresReinspection" BOOLEAN NOT NULL DEFAULT true,
    "reinspectionPassed" BOOLEAN NOT NULL DEFAULT false,
    "reinspectionDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReworkOrder_qualityCheckId_fkey" FOREIGN KEY ("qualityCheckId") REFERENCES "QualityCheck" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReworkOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReworkOrder_moId_fkey" FOREIGN KEY ("moId") REFERENCES "ManufacturingOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReworkOrder_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReworkOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReworkOrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "reworkOrderId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "partNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "fromBatch" TEXT,
    "fromShelf" TEXT,
    "fromLocation" TEXT,
    "usedQuantity" REAL NOT NULL DEFAULT 0,
    "wasteQuantity" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReworkOrderItem_reworkOrderId_fkey" FOREIGN KEY ("reworkOrderId") REFERENCES "ReworkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReworkOrderItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReworkTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "reworkOrderId" TEXT NOT NULL,
    "taskNumber" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "machineId" TEXT,
    "estimatedHours" REAL,
    "actualHours" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReworkTask_reworkOrderId_fkey" FOREIGN KEY ("reworkOrderId") REFERENCES "ReworkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReworkTask_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReworkTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OdooSyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "details" TEXT,
    "odooPoId" TEXT,
    "odooReceiptId" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "BusinessUnit_tenantId_idx" ON "BusinessUnit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUnit_tenantId_code_key" ON "BusinessUnit"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Board_tenantId_idx" ON "Board"("tenantId");

-- CreateIndex
CREATE INDEX "Board_businessUnitId_idx" ON "Board"("businessUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Board_tenantId_businessUnitId_code_key" ON "Board"("tenantId", "businessUnitId", "code");

-- CreateIndex
CREATE INDEX "Workflow_tenantId_idx" ON "Workflow"("tenantId");

-- CreateIndex
CREATE INDEX "Workflow_entityType_idx" ON "Workflow"("entityType");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_tenantId_code_entityType_key" ON "Workflow"("tenantId", "code", "entityType");

-- CreateIndex
CREATE INDEX "WorkflowState_tenantId_idx" ON "WorkflowState"("tenantId");

-- CreateIndex
CREATE INDEX "WorkflowState_workflowId_idx" ON "WorkflowState"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowState_workflowId_code_key" ON "WorkflowState"("workflowId", "code");

-- CreateIndex
CREATE INDEX "WorkflowTransition_tenantId_idx" ON "WorkflowTransition"("tenantId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_workflowId_idx" ON "WorkflowTransition"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTransition_workflowId_fromStateId_toStateId_key" ON "WorkflowTransition"("workflowId", "fromStateId", "toStateId");

-- CreateIndex
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");

-- CreateIndex
CREATE INDEX "Order_boardId_idx" ON "Order"("boardId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_workflowId_idx" ON "Order"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_tenantId_idx" ON "ManufacturingOrder"("tenantId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_orderId_idx" ON "ManufacturingOrder"("orderId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_status_idx" ON "ManufacturingOrder"("status");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_workflowId_idx" ON "ManufacturingOrder"("workflowId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_recipeId_idx" ON "ManufacturingOrder"("recipeId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_vendorId_idx" ON "ManufacturingOrder"("vendorId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_isOutsourced_idx" ON "ManufacturingOrder"("isOutsourced");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturingOrder_tenantId_orderId_moNumber_key" ON "ManufacturingOrder"("tenantId", "orderId", "moNumber");

-- CreateIndex
CREATE INDEX "Jobsheet_tenantId_idx" ON "Jobsheet"("tenantId");

-- CreateIndex
CREATE INDEX "Jobsheet_moId_idx" ON "Jobsheet"("moId");

-- CreateIndex
CREATE INDEX "Jobsheet_status_idx" ON "Jobsheet"("status");

-- CreateIndex
CREATE INDEX "Jobsheet_dependsOn_idx" ON "Jobsheet"("dependsOn");

-- CreateIndex
CREATE UNIQUE INDEX "Jobsheet_tenantId_moId_jsNumber_key" ON "Jobsheet"("tenantId", "moId", "jsNumber");

-- CreateIndex
CREATE INDEX "MachiningTask_tenantId_idx" ON "MachiningTask"("tenantId");

-- CreateIndex
CREATE INDEX "MachiningTask_jobsheetId_idx" ON "MachiningTask"("jobsheetId");

-- CreateIndex
CREATE INDEX "MachiningTask_machineId_idx" ON "MachiningTask"("machineId");

-- CreateIndex
CREATE INDEX "MachiningTask_status_idx" ON "MachiningTask"("status");

-- CreateIndex
CREATE INDEX "MachiningTask_assignedTo_idx" ON "MachiningTask"("assignedTo");

-- CreateIndex
CREATE INDEX "MachiningTask_dependsOn_idx" ON "MachiningTask"("dependsOn");

-- CreateIndex
CREATE UNIQUE INDEX "MachiningTask_tenantId_jobsheetId_taskNumber_key" ON "MachiningTask"("tenantId", "jobsheetId", "taskNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOutput_outputNumber_key" ON "ProductionOutput"("outputNumber");

-- CreateIndex
CREATE INDEX "ProductionOutput_tenantId_idx" ON "ProductionOutput"("tenantId");

-- CreateIndex
CREATE INDEX "ProductionOutput_taskId_idx" ON "ProductionOutput"("taskId");

-- CreateIndex
CREATE INDEX "ProductionOutput_jobsheetId_idx" ON "ProductionOutput"("jobsheetId");

-- CreateIndex
CREATE INDEX "ProductionOutput_moId_idx" ON "ProductionOutput"("moId");

-- CreateIndex
CREATE INDEX "ProductionOutput_status_idx" ON "ProductionOutput"("status");

-- CreateIndex
CREATE INDEX "ProductionOutput_partNumber_idx" ON "ProductionOutput"("partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOutput_tenantId_outputNumber_key" ON "ProductionOutput"("tenantId", "outputNumber");

-- CreateIndex
CREATE INDEX "JobsheetMaterial_tenantId_idx" ON "JobsheetMaterial"("tenantId");

-- CreateIndex
CREATE INDEX "JobsheetMaterial_jobsheetId_idx" ON "JobsheetMaterial"("jobsheetId");

-- CreateIndex
CREATE INDEX "JobsheetMaterial_materialRequirementId_idx" ON "JobsheetMaterial"("materialRequirementId");

-- CreateIndex
CREATE INDEX "JobsheetMaterial_status_idx" ON "JobsheetMaterial"("status");

-- CreateIndex
CREATE INDEX "TaskMaterialAllocation_tenantId_idx" ON "TaskMaterialAllocation"("tenantId");

-- CreateIndex
CREATE INDEX "TaskMaterialAllocation_jobsheetMaterialId_idx" ON "TaskMaterialAllocation"("jobsheetMaterialId");

-- CreateIndex
CREATE INDEX "TaskMaterialAllocation_taskId_idx" ON "TaskMaterialAllocation"("taskId");

-- CreateIndex
CREATE INDEX "TaskMaterialAllocation_status_idx" ON "TaskMaterialAllocation"("status");

-- CreateIndex
CREATE INDEX "Machine_tenantId_idx" ON "Machine"("tenantId");

-- CreateIndex
CREATE INDEX "Machine_status_idx" ON "Machine"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_tenantId_code_key" ON "Machine"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Breakdown_tenantId_idx" ON "Breakdown"("tenantId");

-- CreateIndex
CREATE INDEX "Breakdown_machineId_idx" ON "Breakdown"("machineId");

-- CreateIndex
CREATE INDEX "Breakdown_resolved_idx" ON "Breakdown"("resolved");

-- CreateIndex
CREATE INDEX "Breakdown_reportedAt_idx" ON "Breakdown"("reportedAt");

-- CreateIndex
CREATE INDEX "MaterialRequirement_tenantId_idx" ON "MaterialRequirement"("tenantId");

-- CreateIndex
CREATE INDEX "MaterialRequirement_moId_idx" ON "MaterialRequirement"("moId");

-- CreateIndex
CREATE INDEX "MaterialRequirement_partNumber_idx" ON "MaterialRequirement"("partNumber");

-- CreateIndex
CREATE INDEX "MaterialRequirement_status_idx" ON "MaterialRequirement"("status");

-- CreateIndex
CREATE INDEX "MaterialRequirement_requiredDate_idx" ON "MaterialRequirement"("requiredDate");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRequirement_tenantId_moId_partNumber_key" ON "MaterialRequirement"("tenantId", "moId", "partNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequest_tenantId_idx" ON "PurchaseRequest"("tenantId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_supplierId_idx" ON "PurchaseRequest"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_sourceMoId_idx" ON "PurchaseRequest"("sourceMoId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_odooPrId_idx" ON "PurchaseRequest"("odooPrId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_tenantId_prNumber_key" ON "PurchaseRequest"("tenantId", "prNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_tenantId_idx" ON "PurchaseRequestItem"("tenantId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_purchaseRequestId_idx" ON "PurchaseRequestItem"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_materialRequirementId_idx" ON "PurchaseRequestItem"("materialRequirementId");

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_inventoryId_idx" ON "PurchaseRequestItem"("inventoryId");

-- CreateIndex
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");

-- CreateIndex
CREATE INDEX "Supplier_supplierType_idx" ON "Supplier"("supplierType");

-- CreateIndex
CREATE INDEX "Supplier_odooPartnerId_idx" ON "Supplier"("odooPartnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_tenantId_code_key" ON "Supplier"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_vendorOrderId_key" ON "VendorOrder"("vendorOrderId");

-- CreateIndex
CREATE INDEX "VendorOrder_tenantId_idx" ON "VendorOrder"("tenantId");

-- CreateIndex
CREATE INDEX "VendorOrder_vendorId_idx" ON "VendorOrder"("vendorId");

-- CreateIndex
CREATE INDEX "VendorOrder_status_idx" ON "VendorOrder"("status");

-- CreateIndex
CREATE INDEX "VendorOrder_orderId_idx" ON "VendorOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_tenantId_vendorOrderId_key" ON "VendorOrder"("tenantId", "vendorOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorOrder_moId_key" ON "VendorOrder"("moId");

-- CreateIndex
CREATE INDEX "VendorOrderItem_tenantId_idx" ON "VendorOrderItem"("tenantId");

-- CreateIndex
CREATE INDEX "VendorOrderItem_vendorOrderId_idx" ON "VendorOrderItem"("vendorOrderId");

-- CreateIndex
CREATE INDEX "VendorOrderItem_materialId_idx" ON "VendorOrderItem"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorShipment_shipmentNumber_key" ON "VendorShipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "VendorShipment_tenantId_idx" ON "VendorShipment"("tenantId");

-- CreateIndex
CREATE INDEX "VendorShipment_vendorOrderId_idx" ON "VendorShipment"("vendorOrderId");

-- CreateIndex
CREATE INDEX "VendorShipment_status_idx" ON "VendorShipment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorShipment_tenantId_shipmentNumber_key" ON "VendorShipment"("tenantId", "shipmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvoice_invoiceNumber_key" ON "VendorInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "VendorInvoice_tenantId_idx" ON "VendorInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "VendorInvoice_vendorOrderId_idx" ON "VendorInvoice"("vendorOrderId");

-- CreateIndex
CREATE INDEX "VendorInvoice_status_idx" ON "VendorInvoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvoice_tenantId_invoiceNumber_key" ON "VendorInvoice"("tenantId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Location_tenantId_idx" ON "Location"("tenantId");

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE INDEX "Location_parentLocationId_idx" ON "Location"("parentLocationId");

-- CreateIndex
CREATE INDEX "Location_picUserId_idx" ON "Location"("picUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_tenantId_code_key" ON "Location"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Shelf_tenantId_idx" ON "Shelf"("tenantId");

-- CreateIndex
CREATE INDEX "Shelf_locationId_idx" ON "Shelf"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Shelf_tenantId_locationId_code_key" ON "Shelf"("tenantId", "locationId", "code");

-- CreateIndex
CREATE INDEX "MaterialHandoff_tenantId_idx" ON "MaterialHandoff"("tenantId");

-- CreateIndex
CREATE INDEX "MaterialHandoff_fromLocationId_idx" ON "MaterialHandoff"("fromLocationId");

-- CreateIndex
CREATE INDEX "MaterialHandoff_toLocationId_idx" ON "MaterialHandoff"("toLocationId");

-- CreateIndex
CREATE INDEX "MaterialHandoff_moId_idx" ON "MaterialHandoff"("moId");

-- CreateIndex
CREATE INDEX "MaterialHandoff_status_idx" ON "MaterialHandoff"("status");

-- CreateIndex
CREATE INDEX "MaterialHandoff_referenceType_referenceId_idx" ON "MaterialHandoff"("referenceType", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialHandoff_tenantId_handoffNumber_key" ON "MaterialHandoff"("tenantId", "handoffNumber");

-- CreateIndex
CREATE INDEX "MaterialHandoffItem_tenantId_idx" ON "MaterialHandoffItem"("tenantId");

-- CreateIndex
CREATE INDEX "MaterialHandoffItem_handoffId_idx" ON "MaterialHandoffItem"("handoffId");

-- CreateIndex
CREATE INDEX "MaterialHandoffItem_inventoryId_idx" ON "MaterialHandoffItem"("inventoryId");

-- CreateIndex
CREATE INDEX "Inventory_tenantId_idx" ON "Inventory"("tenantId");

-- CreateIndex
CREATE INDEX "Inventory_status_idx" ON "Inventory"("status");

-- CreateIndex
CREATE INDEX "Inventory_supplierId_idx" ON "Inventory"("supplierId");

-- CreateIndex
CREATE INDEX "Inventory_category_idx" ON "Inventory"("category");

-- CreateIndex
CREATE INDEX "Inventory_locationId_idx" ON "Inventory"("locationId");

-- CreateIndex
CREATE INDEX "Inventory_shelfId_idx" ON "Inventory"("shelfId");

-- CreateIndex
CREATE INDEX "Inventory_currentProcess_idx" ON "Inventory"("currentProcess");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_tenantId_partNumber_batch_key" ON "Inventory"("tenantId", "partNumber", "batch");

-- CreateIndex
CREATE INDEX "InventoryReservation_tenantId_idx" ON "InventoryReservation"("tenantId");

-- CreateIndex
CREATE INDEX "InventoryReservation_inventoryId_idx" ON "InventoryReservation"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryReservation_materialRequirementId_idx" ON "InventoryReservation"("materialRequirementId");

-- CreateIndex
CREATE INDEX "InventoryReservation_orderId_idx" ON "InventoryReservation"("orderId");

-- CreateIndex
CREATE INDEX "InventoryReservation_moId_idx" ON "InventoryReservation"("moId");

-- CreateIndex
CREATE INDEX "InventoryReservation_status_idx" ON "InventoryReservation"("status");

-- CreateIndex
CREATE INDEX "InventoryTransaction_tenantId_idx" ON "InventoryTransaction"("tenantId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_inventoryId_idx" ON "InventoryTransaction"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_referenceType_referenceId_idx" ON "InventoryTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryTransaction_handoffStatus_idx" ON "InventoryTransaction"("handoffStatus");

-- CreateIndex
CREATE INDEX "PurchaseOrder_tenantId_idx" ON "PurchaseOrder"("tenantId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_odooPoId_idx" ON "PurchaseOrder"("odooPoId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_tenantId_poNumber_key" ON "PurchaseOrder"("tenantId", "poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_tenantId_idx" ON "PurchaseOrderItem"("tenantId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_inventoryId_idx" ON "PurchaseOrderItem"("inventoryId");

-- CreateIndex
CREATE INDEX "Recipe_tenantId_idx" ON "Recipe"("tenantId");

-- CreateIndex
CREATE INDEX "Recipe_outputPartNumber_idx" ON "Recipe"("outputPartNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_tenantId_code_version_key" ON "Recipe"("tenantId", "code", "version");

-- CreateIndex
CREATE INDEX "RecipeIngredient_tenantId_idx" ON "RecipeIngredient"("tenantId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_inventoryId_idx" ON "RecipeIngredient"("inventoryId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE INDEX "Role_code_idx" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_category_idx" ON "SystemSettings"("category");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "QualityCheck_qcNumber_key" ON "QualityCheck"("qcNumber");

-- CreateIndex
CREATE INDEX "QualityCheck_tenantId_idx" ON "QualityCheck"("tenantId");

-- CreateIndex
CREATE INDEX "QualityCheck_referenceType_referenceId_idx" ON "QualityCheck"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "QualityCheck_orderId_idx" ON "QualityCheck"("orderId");

-- CreateIndex
CREATE INDEX "QualityCheck_moId_idx" ON "QualityCheck"("moId");

-- CreateIndex
CREATE INDEX "QualityCheck_status_idx" ON "QualityCheck"("status");

-- CreateIndex
CREATE INDEX "QualityCheck_checkType_idx" ON "QualityCheck"("checkType");

-- CreateIndex
CREATE UNIQUE INDEX "QualityCheck_tenantId_qcNumber_key" ON "QualityCheck"("tenantId", "qcNumber");

-- CreateIndex
CREATE INDEX "QualityCheckItem_tenantId_idx" ON "QualityCheckItem"("tenantId");

-- CreateIndex
CREATE INDEX "QualityCheckItem_qualityCheckId_idx" ON "QualityCheckItem"("qualityCheckId");

-- CreateIndex
CREATE INDEX "QualityCheckItem_result_idx" ON "QualityCheckItem"("result");

-- CreateIndex
CREATE UNIQUE INDEX "ReworkOrder_reworkNumber_key" ON "ReworkOrder"("reworkNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReworkOrder_qualityCheckId_key" ON "ReworkOrder"("qualityCheckId");

-- CreateIndex
CREATE INDEX "ReworkOrder_tenantId_idx" ON "ReworkOrder"("tenantId");

-- CreateIndex
CREATE INDEX "ReworkOrder_qualityCheckId_idx" ON "ReworkOrder"("qualityCheckId");

-- CreateIndex
CREATE INDEX "ReworkOrder_status_idx" ON "ReworkOrder"("status");

-- CreateIndex
CREATE INDEX "ReworkOrder_reworkType_idx" ON "ReworkOrder"("reworkType");

-- CreateIndex
CREATE UNIQUE INDEX "ReworkOrder_tenantId_reworkNumber_key" ON "ReworkOrder"("tenantId", "reworkNumber");

-- CreateIndex
CREATE INDEX "ReworkOrderItem_tenantId_idx" ON "ReworkOrderItem"("tenantId");

-- CreateIndex
CREATE INDEX "ReworkOrderItem_reworkOrderId_idx" ON "ReworkOrderItem"("reworkOrderId");

-- CreateIndex
CREATE INDEX "ReworkTask_tenantId_idx" ON "ReworkTask"("tenantId");

-- CreateIndex
CREATE INDEX "ReworkTask_reworkOrderId_idx" ON "ReworkTask"("reworkOrderId");

-- CreateIndex
CREATE INDEX "ReworkTask_status_idx" ON "ReworkTask"("status");

-- CreateIndex
CREATE INDEX "OdooSyncLog_tenantId_idx" ON "OdooSyncLog"("tenantId");

-- CreateIndex
CREATE INDEX "OdooSyncLog_syncType_idx" ON "OdooSyncLog"("syncType");

-- CreateIndex
CREATE INDEX "OdooSyncLog_syncedAt_idx" ON "OdooSyncLog"("syncedAt");

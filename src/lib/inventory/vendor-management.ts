// Vendor Management Service for ManuOS
// Handles contract manufacturing, outsourcing, and vendor relationships

import { db } from '@/lib/db'

// ============================================
// Vendor (Supplier) Management
// ============================================

export interface CreateVendorInput {
  tenantId: string
  code: string
  name: string
  supplierType?: string
  vendorTier?: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  capabilities?: string[]  // JSON array
  certifications?: string
  leadTimeDays?: number
  moq?: number
  paymentTerms?: string
  currency?: string
  creditLimit?: number
  notes?: string
}

export async function createVendor(input: CreateVendorInput) {
  return db.supplier.create({
    data: {
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      supplierType: input.supplierType as any || 'MATERIAL',
      vendorTier: input.vendorTier,
      contactPerson: input.contactPerson,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      country: input.country,
      capabilities: input.capabilities ? JSON.stringify(input.capabilities) : null,
      certifications: input.certifications,
      leadTimeDays: input.leadTimeDays,
      moq: input.moq,
      paymentTerms: input.paymentTerms,
      currency: input.currency || 'IDR',
      creditLimit: input.creditLimit,
      notes: input.notes,
    },
  })
}

export async function getVendors(
  tenantId: string,
  filters?: {
    supplierType?: string
    vendorTier?: string
    isActive?: boolean
    capability?: string
  }
) {
  const where: any = { tenantId }
  
  if (filters?.supplierType) where.supplierType = filters.supplierType
  if (filters?.vendorTier) where.vendorTier = filters.vendorTier
  if (filters?.isActive !== undefined) where.isActive = filters.isActive
  
  const vendors = await db.supplier.findMany({
    where,
    include: {
      vendorOrders: {
        select: {
          id: true,
          vendorOrderId: true,
          status: true,
          totalAmount: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      outsourcedMfgOrders: {
        select: {
          id: true,
          moNumber: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { name: 'asc' },
  })
  
  // Parse capabilities JSON
  return vendors.map(v => ({
    ...v,
    capabilities: v.capabilities ? JSON.parse(v.capabilities) : [],
  }))
}

export async function getVendorById(tenantId: string, id: string) {
  const vendor = await db.supplier.findFirst({
    where: { id, tenantId },
    include: {
      vendorOrders: {
        include: {
          items: true,
          shipments: true,
          invoices: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      outsourcedMfgOrders: {
        include: {
          order: { select: { orderNumber: true, customerName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  
  if (vendor) {
    return {
      ...vendor,
      capabilities: vendor.capabilities ? JSON.parse(vendor.capabilities) : [],
    }
  }
  return null
}

export async function updateVendorRating(
  vendorId: string,
  tenantId: string,
  ratings: {
    qualityRating?: number
    deliveryRating?: number
    priceRating?: number
    onTimeDelivery?: number
  }
) {
  // Get current vendor data
  const vendor = await db.supplier.findFirst({
    where: { id: vendorId, tenantId },
  })
  
  if (!vendor) throw new Error('Vendor not found')
  
  // Calculate new ratings (weighted average)
  const totalOrders = vendor.totalOrders + 1
  const newQualityRating = ratings.qualityRating 
    ? (vendor.qualityRating * vendor.totalOrders + ratings.qualityRating) / totalOrders
    : vendor.qualityRating
  const newDeliveryRating = ratings.deliveryRating
    ? (vendor.deliveryRating * vendor.totalOrders + ratings.deliveryRating) / totalOrders
    : vendor.deliveryRating
  const newPriceRating = ratings.priceRating
    ? (vendor.priceRating * vendor.totalOrders + ratings.priceRating) / totalOrders
    : vendor.priceRating
  
  return db.supplier.update({
    where: { id: vendorId },
    data: {
      qualityRating: newQualityRating,
      deliveryRating: newDeliveryRating,
      priceRating: newPriceRating,
      onTimeDelivery: ratings.onTimeDelivery ?? vendor.onTimeDelivery,
      totalOrders,
    },
  })
}

// ============================================
// Vendor Order (Outsourced Manufacturing)
// ============================================

export async function generateVendorOrderId(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `VO-${year}-`
  
  const lastOrder = await db.vendorOrder.findFirst({
    where: {
      tenantId,
      vendorOrderId: { startsWith: prefix },
    },
    orderBy: { vendorOrderId: 'desc' },
  })
  
  let sequence = 1
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.vendorOrderId.replace(prefix, ''), 10)
    sequence = lastSeq + 1
  }
  
  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

export interface CreateVendorOrderInput {
  tenantId: string
  vendorId: string
  orderId?: string
  moId?: string
  title: string
  description?: string
  referenceNumber?: string
  vendorQuoteNumber?: string
  outsourceType?: string
  workDescription: string
  quantity: number
  unit?: string
  unitPrice: number
  currency?: string
  paymentTerms?: string
  promisedDate?: Date
  vendorLeadTimeDays?: number
  qualityRequired?: boolean
  shippingMethod?: string
  notes?: string
  internalNotes?: string
  items?: {
    partNumber: string
    name: string
    description?: string
    quantity: number
    unit?: string
    unitPrice: number
  }[]
}

export async function createVendorOrder(input: CreateVendorOrderInput) {
  const vendorOrderId = await generateVendorOrderId(input.tenantId)
  const totalPrice = input.quantity * input.unitPrice
  
  const vendorOrder = await db.vendorOrder.create({
    data: {
      tenantId: input.tenantId,
      vendorOrderId,
      vendorId: input.vendorId,
      orderId: input.orderId,
      moId: input.moId,
      title: input.title,
      description: input.description,
      referenceNumber: input.referenceNumber,
      vendorQuoteNumber: input.vendorQuoteNumber,
      outsourceType: input.outsourceType as any || 'FULL',
      workDescription: input.workDescription,
      quantity: input.quantity,
      unit: input.unit,
      unitPrice: input.unitPrice,
      totalPrice,
      currency: input.currency || 'IDR',
      paymentTerms: input.paymentTerms,
      promisedDate: input.promisedDate,
      vendorLeadTimeDays: input.vendorLeadTimeDays,
      qualityRequired: input.qualityRequired ?? true,
      shippingMethod: input.shippingMethod,
      notes: input.notes,
      internalNotes: input.internalNotes,
      status: 'DRAFT',
      items: input.items ? {
        create: input.items.map(item => ({
          tenantId: input.tenantId,
          partNumber: item.partNumber,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      } : undefined,
    },
    include: {
      vendor: true,
      items: true,
    },
  })
  
  // Update MO with vendor info if outsourced
  if (input.moId) {
    await db.manufacturingOrder.update({
      where: { id: input.moId },
      data: {
        isOutsourced: true,
        outsourcedType: input.outsourceType as any || 'FULL',
        vendorId: input.vendorId,
        vendorOrderNumber: vendorOrderId,
        vendorQuoteNumber: input.vendorQuoteNumber,
        vendorEstimatedCost: totalPrice,
        vendorLeadTimeDays: input.vendorLeadTimeDays,
        vendorNotes: input.notes,
      },
    })
  }
  
  return vendorOrder
}

export async function getVendorOrders(
  tenantId: string,
  filters?: {
    status?: string
    vendorId?: string
    outsourceType?: string
    orderId?: string
  }
) {
  const where: any = { tenantId }
  
  if (filters?.status) where.status = filters.status
  if (filters?.vendorId) where.vendorId = filters.vendorId
  if (filters?.outsourceType) where.outsourceType = filters.outsourceType
  if (filters?.orderId) where.orderId = filters.orderId
  
  return db.vendorOrder.findMany({
    where,
    include: {
      vendor: { select: { name: true, code: true, qualityRating: true } },
      order: { select: { orderNumber: true, customerName: true } },
      manufacturingOrder: { select: { moNumber: true } },
      items: true,
      shipments: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getVendorOrderById(tenantId: string, id: string) {
  return db.vendorOrder.findFirst({
    where: { id, tenantId },
    include: {
      vendor: true,
      order: true,
      manufacturingOrder: {
        include: {
          jobsheets: {
            include: {
              tasks: true,
            },
          },
        },
      },
      items: {
        include: {
          material: { select: { batch: true, shelf: true, location: true } },
        },
      },
      shipments: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
    },
  })
}

// ============================================
// Vendor Order Status Updates
// ============================================

export async function approveVendorOrder(vendorOrderId: string, tenantId: string, approvedBy: string) {
  return db.vendorOrder.update({
    where: { id: vendorOrderId },
    data: {
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
    },
  })
}

export async function sendVendorOrder(vendorOrderId: string, tenantId: string) {
  return db.vendorOrder.update({
    where: { id: vendorOrderId },
    data: {
      status: 'ORDERED',
    },
  })
}

export async function startVendorWork(vendorOrderId: string, tenantId: string) {
  return db.vendorOrder.update({
    where: { id: vendorOrderId },
    data: {
      status: 'IN_PROGRESS',
    },
  })
}

export async function completeVendorOrder(
  vendorOrderId: string,
  tenantId: string,
  result: {
    actualCost?: number
    actualDeliveryDate?: Date
    qualityPassed?: boolean
    qcNotes?: string
  }
) {
  const vendorOrder = await db.vendorOrder.update({
    where: { id: vendorOrderId },
    data: {
      status: 'COMPLETED',
      vendorActualCost: result.actualCost,
      actualDeliveryDate: result.actualDeliveryDate || new Date(),
      qualityPassed: result.qualityPassed,
      qcNotes: result.qcNotes,
    },
    include: {
      vendor: true,
      manufacturingOrder: true,
    },
  })
  
  // Update vendor performance metrics
  if (vendorOrder.promisedDate && result.actualDeliveryDate) {
    const onTime = result.actualDeliveryDate <= vendorOrder.promisedDate
    const daysLate = onTime ? 0 : Math.ceil(
      (result.actualDeliveryDate.getTime() - vendorOrder.promisedDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // Update vendor rating
    const currentVendor = await db.supplier.findFirst({
      where: { id: vendorOrder.vendorId },
    })
    
    if (currentVendor) {
      const onTimeCount = onTime ? (currentVendor.onTimeDelivery || 100) : Math.max(0, (currentVendor.onTimeDelivery || 100) - 5)
      await db.supplier.update({
        where: { id: vendorOrder.vendorId },
        data: {
          totalOrders: { increment: 1 },
          onTimeDelivery: onTimeCount,
        },
      })
    }
  }
  
  // Update MO status if linked
  if (vendorOrder.manufacturingOrder) {
    await db.manufacturingOrder.update({
      where: { id: vendorOrder.manufacturingOrder.id },
      data: {
        status: 'COMPLETED',
        actualEndDate: new Date(),
        vendorActualCost: result.actualCost,
      },
    })
  }
  
  return vendorOrder
}

export async function cancelVendorOrder(vendorOrderId: string, tenantId: string, notes?: string) {
  return db.vendorOrder.update({
    where: { id: vendorOrderId },
    data: {
      status: 'CANCELLED',
      notes: notes,
    },
  })
}

// ============================================
// Vendor Shipments
// ============================================

export async function generateShipmentNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `SHP-V-${year}-`
  
  const lastShipment = await db.vendorShipment.findFirst({
    where: {
      tenantId,
      shipmentNumber: { startsWith: prefix },
    },
    orderBy: { shipmentNumber: 'desc' },
  })
  
  let sequence = 1
  if (lastShipment) {
    const lastSeq = parseInt(lastShipment.shipmentNumber.replace(prefix, ''), 10)
    sequence = lastSeq + 1
  }
  
  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

export interface CreateVendorShipmentInput {
  tenantId: string
  vendorOrderId: string
  shipmentType: string  // INBOUND, OUTBOUND
  carrier?: string
  trackingNumber?: string
  quantity: number
  unit?: string
  shippedDate: Date
  expectedDate?: Date
  notes?: string
}

export async function createVendorShipment(input: CreateVendorShipmentInput) {
  const shipmentNumber = await generateShipmentNumber(input.tenantId)
  
  return db.vendorShipment.create({
    data: {
      tenantId: input.tenantId,
      vendorOrderId: input.vendorOrderId,
      shipmentNumber,
      shipmentType: input.shipmentType,
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      quantity: input.quantity,
      unit: input.unit,
      shippedDate: input.shippedDate,
      expectedDate: input.expectedDate,
      notes: input.notes,
      status: 'SHIPPED',
    },
  })
}

export async function receiveVendorShipment(
  shipmentId: string,
  tenantId: string,
  inspection: {
    inspectedBy: string
    inspectionResult: string  // ACCEPTED, REJECTED, PARTIAL
    inspectionNotes?: string
  }
) {
  const shipment = await db.vendorShipment.update({
    where: { id: shipmentId },
    data: {
      status: 'RECEIVED',
      receivedDate: new Date(),
      inspectedBy: inspection.inspectedBy,
      inspectionResult: inspection.inspectionResult,
      inspectionNotes: inspection.inspectionNotes,
    },
    include: {
      vendorOrder: true,
    },
  })
  
  // Update vendor order received quantity
  if (shipment.vendorOrder) {
    const newReceivedQty = await db.vendorShipment.aggregate({
      where: {
        vendorOrderId: shipment.vendorOrderId,
        status: { in: ['RECEIVED', 'ACCEPTED'] },
      },
      _sum: { quantity: true },
    })
    
    const acceptedQty = shipment.inspectionResult === 'ACCEPTED' 
      ? shipment.quantity 
      : shipment.inspectionResult === 'PARTIAL'
        ? shipment.quantity * 0.8  // Assume 80% accepted
        : 0
    
    // Update vendor order status
    const vendorOrder = await db.vendorOrder.findFirst({
      where: { id: shipment.vendorOrderId },
    })
    
    if (vendorOrder) {
      const totalReceived = (newReceivedQty._sum.quantity || 0)
      const isComplete = totalReceived >= vendorOrder.quantity
      
      await db.vendorOrder.update({
        where: { id: shipment.vendorOrderId },
        data: {
          status: isComplete ? 'RECEIVED' : 'IN_PROGRESS',
        },
      })
    }
  }
  
  return shipment
}

// ============================================
// Vendor Statistics
// ============================================

export async function getVendorStats(tenantId: string) {
  const [totalVendors, contractManufacturers, activeOrders, completedOrders] = await Promise.all([
    db.supplier.count({ where: { tenantId, isActive: true } }),
    db.supplier.count({ where: { tenantId, supplierType: { in: ['CONTRACT_MANUFACTURER', 'BOTH'] }, isActive: true } }),
    db.vendorOrder.count({ where: { tenantId, status: { in: ['ORDERED', 'IN_PROGRESS'] } } }),
    db.vendorOrder.count({ where: { tenantId, status: 'COMPLETED' } }),
  ])
  
  const totalOutsourcedValue = await db.vendorOrder.aggregate({
    where: { tenantId },
    _sum: { totalPrice: true },
  })
  
  const topVendors = await db.supplier.findMany({
    where: { tenantId, supplierType: { in: ['CONTRACT_MANUFACTURER', 'BOTH'] } },
    select: {
      id: true,
      name: true,
      code: true,
      qualityRating: true,
      deliveryRating: true,
      onTimeDelivery: true,
      totalOrders: true,
    },
    orderBy: { qualityRating: 'desc' },
    take: 5,
  })
  
  return {
    totalVendors,
    contractManufacturers,
    activeOrders,
    completedOrders,
    totalOutsourcedValue: totalOutsourcedValue._sum.totalPrice || 0,
    topVendors,
  }
}
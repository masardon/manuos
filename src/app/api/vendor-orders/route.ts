import { NextRequest, NextResponse } from 'next/server'
import {
  getVendorOrders,
  createVendorOrder,
  getVendorOrderById,
  approveVendorOrder,
  sendVendorOrder,
  startVendorWork,
  completeVendorOrder,
  cancelVendorOrder,
} from '@/lib/inventory/vendor-management'

const DEMO_TENANT_ID = 'demo-tenant'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const vendorId = searchParams.get('vendorId') || undefined
    const outsourceType = searchParams.get('outsourceType') || undefined
    const orderId = searchParams.get('orderId') || undefined
    const id = searchParams.get('id')
    
    if (id) {
      const vendorOrder = await getVendorOrderById(DEMO_TENANT_ID, id)
      if (!vendorOrder) {
        return NextResponse.json({ error: 'Vendor order not found' }, { status: 404 })
      }
      return NextResponse.json({ vendorOrder })
    }
    
    const vendorOrders = await getVendorOrders(DEMO_TENANT_ID, {
      status: status || undefined,
      vendorId: vendorId || undefined,
      outsourceType: outsourceType || undefined,
      orderId: orderId || undefined,
    })
    
    return NextResponse.json({ vendorOrders })
  } catch (error) {
    console.error('Error fetching vendor orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action
    
    if (action === 'approve') {
      const result = await approveVendorOrder(body.vendorOrderId, DEMO_TENANT_ID, body.approvedBy)
      return NextResponse.json({ vendorOrder: result })
    }
    
    if (action === 'send') {
      const result = await sendVendorOrder(body.vendorOrderId, DEMO_TENANT_ID)
      return NextResponse.json({ vendorOrder: result })
    }
    
    if (action === 'start') {
      const result = await startVendorWork(body.vendorOrderId, DEMO_TENANT_ID)
      return NextResponse.json({ vendorOrder: result })
    }
    
    if (action === 'complete') {
      const result = await completeVendorOrder(body.vendorOrderId, DEMO_TENANT_ID, {
        actualCost: body.actualCost,
        actualDeliveryDate: body.actualDeliveryDate ? new Date(body.actualDeliveryDate) : undefined,
        qualityPassed: body.qualityPassed,
        qcNotes: body.qcNotes,
      })
      return NextResponse.json({ vendorOrder: result })
    }
    
    if (action === 'cancel') {
      const result = await cancelVendorOrder(body.vendorOrderId, DEMO_TENANT_ID, body.notes)
      return NextResponse.json({ vendorOrder: result })
    }
    
    // Default: create new vendor order
    const vendorOrder = await createVendorOrder({
      tenantId: DEMO_TENANT_ID,
      vendorId: body.vendorId,
      orderId: body.orderId,
      moId: body.moId,
      title: body.title,
      description: body.description,
      referenceNumber: body.referenceNumber,
      vendorQuoteNumber: body.vendorQuoteNumber,
      outsourceType: body.outsourceType,
      workDescription: body.workDescription,
      quantity: body.quantity,
      unit: body.unit,
      unitPrice: body.unitPrice,
      currency: body.currency,
      paymentTerms: body.paymentTerms,
      promisedDate: body.promisedDate ? new Date(body.promisedDate) : undefined,
      vendorLeadTimeDays: body.vendorLeadTimeDays,
      qualityRequired: body.qualityRequired,
      shippingMethod: body.shippingMethod,
      notes: body.notes,
      internalNotes: body.internalNotes,
      items: body.items,
    })
    
    return NextResponse.json({ vendorOrder }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating vendor order:', error)
    return NextResponse.json(
      { error: 'Failed to process vendor order' },
      { status: 500 }
    )
  }
}
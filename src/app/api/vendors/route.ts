import { NextRequest, NextResponse } from 'next/server'
import {
  getVendors,
  createVendor,
  getVendorStats,
  getVendorById,
} from '@/lib/inventory/vendor-management'

const DEMO_TENANT_ID = 'demo-tenant'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierType = searchParams.get('supplierType') || undefined
    const vendorTier = searchParams.get('vendorTier') || undefined
    const stats = searchParams.get('stats') === 'true'
    const id = searchParams.get('id')
    
    if (stats) {
      const vendorStats = await getVendorStats(DEMO_TENANT_ID)
      return NextResponse.json({ stats: vendorStats })
    }
    
    if (id) {
      const vendor = await getVendorById(DEMO_TENANT_ID, id)
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
      }
      return NextResponse.json({ vendor })
    }
    
    const vendors = await getVendors(DEMO_TENANT_ID, {
      supplierType: supplierType || undefined,
      vendorTier: vendorTier || undefined,
    })
    
    return NextResponse.json({ vendors })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const vendor = await createVendor({
      tenantId: DEMO_TENANT_ID,
      code: body.code,
      name: body.name,
      supplierType: body.supplierType,
      vendorTier: body.vendorTier,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      country: body.country,
      capabilities: body.capabilities,
      certifications: body.certifications,
      leadTimeDays: body.leadTimeDays,
      moq: body.moq,
      paymentTerms: body.paymentTerms,
      currency: body.currency,
      creditLimit: body.creditLimit,
      notes: body.notes,
    })
    
    return NextResponse.json({ vendor }, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
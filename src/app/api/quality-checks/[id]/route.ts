import { NextRequest, NextResponse } from 'next/server'
import {
  getQualityCheckById,
  recordQCResult,
  approveByCustomer,
  rejectByCustomer,
} from '@/lib/inventory/quality-control'

const DEMO_TENANT_ID = 'tenant_ypti'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const qualityCheck = await getQualityCheckById(DEMO_TENANT_ID, id)
    
    if (!qualityCheck) {
      return NextResponse.json(
        { error: 'Quality check not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ qualityCheck })
  } catch (error) {
    console.error('Error fetching quality check:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality check' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const action = body.action
    
    if (action === 'record-result') {
      const result = await recordQCResult({
        qualityCheckId: id,
        tenantId: DEMO_TENANT_ID,
        results: body.results,
        overallStatus: body.overallStatus,
        passQuantity: body.passQuantity,
        failQuantity: body.failQuantity,
        reworkQuantity: body.reworkQuantity,
        scrapQuantity: body.scrapQuantity,
        defectCode: body.defectCode,
        defectDescription: body.defectDescription,
        defectCategory: body.defectCategory,
        notes: body.notes,
      })
      
      return NextResponse.json({ qualityCheck: result })
    }
    
    if (action === 'customer-approve') {
      const result = await approveByCustomer(id, DEMO_TENANT_ID, body.approvedBy)
      return NextResponse.json({ qualityCheck: result })
    }
    
    if (action === 'customer-reject') {
      const result = await rejectByCustomer(id, DEMO_TENANT_ID, body.reason)
      return NextResponse.json({ qualityCheck: result })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating quality check:', error)
    return NextResponse.json(
      { error: 'Failed to update quality check' },
      { status: 500 }
    )
  }
}
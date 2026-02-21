import { NextRequest, NextResponse } from 'next/server'

// GET /api/reports - List available reports
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      reports: [
        {
          id: 'production',
          name: 'Production Report',
          description: 'Production data with orders and tasks',
          endpoint: '/api/reports/production',
        },
        {
          id: 'efficiency',
          name: 'Efficiency Analysis',
          description: 'Machine efficiency metrics',
          endpoint: '/api/reports/efficiency',
        },
        {
          id: 'orders',
          name: 'Order Summary',
          description: 'Order summary data',
          endpoint: '/api/reports/orders',
        },
        {
          id: 'breakdowns',
          name: 'Breakdown Report',
          description: 'Breakdown statistics',
          endpoint: '/api/reports/breakdowns',
        },
      ],
    })
  } catch (error) {
    console.error('Error fetching reports list:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

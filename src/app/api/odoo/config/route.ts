import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEMO_TENANT_ID = 'tenant_ypti'
const ODOO_SETTING_KEYS = ['odoo_url', 'odoo_db', 'odoo_user', 'odoo_password', 'odoo_enabled']

// GET /api/odoo/config - Get Odoo configuration
export async function GET(request: NextRequest) {
  try {
    const settings = await db.systemSetting.findMany({
      where: {
        tenantId: DEMO_TENANT_ID,
        key: { in: ODOO_SETTING_KEYS },
      },
    })

    const config: Record<string, string> = {}
    settings.forEach(setting => {
      config[setting.key] = setting.value
    })

    // Provide defaults if not set
    const defaults = {
      odoo_url: process.env.ODOO_URL || 'https://demo.odoo.com',
      odoo_db: process.env.ODOO_DB || 'demo',
      odoo_user: process.env.ODOO_USER || 'admin',
      odoo_password: process.env.ODOO_PASSWORD || 'admin',
      odoo_enabled: process.env.ODOO_ENABLED || 'false',
    }

    const mergedConfig = { ...defaults, ...config }

    return NextResponse.json({
      success: true,
      config: mergedConfig,
    })
  } catch (error: any) {
    console.error('Error fetching Odoo config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Odoo config' },
      { status: 500 }
    )
  }
}

// POST /api/odoo/config - Update Odoo configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Config object is required' },
        { status: 400 }
      )
    }

    const updates = []
    for (const [key, value] of Object.entries(config)) {
      if (!ODOO_SETTING_KEYS.includes(key)) continue
      
      // Find existing setting
      const existing = await db.systemSetting.findFirst({
        where: {
          tenantId: DEMO_TENANT_ID,
          key,
        },
      })

      if (existing) {
        updates.push(
          db.systemSetting.update({
            where: { id: existing.id },
            data: { value: String(value), updatedAt: new Date() },
          })
        )
      } else {
        updates.push(
          db.systemSetting.create({
            data: {
              tenantId: DEMO_TENANT_ID,
              key,
              value: String(value),
              category: 'Integrations',
              type: key === 'odoo_enabled' ? 'boolean' : 'string',
              description: `Odoo integration ${key.replace('odoo_', '')}`,
              isPublic: false,
            },
          })
        )
      }
    }

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: 'Odoo configuration updated',
    })
  } catch (error: any) {
    console.error('Error updating Odoo config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update Odoo config' },
      { status: 500 }
    )
  }
}
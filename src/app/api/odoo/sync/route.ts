import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { syncPurchaseOrdersToOdoo, syncGoodsReceiptToOdoo, OdooConfig } from '@/lib/integrations/odoo'

const DEMO_TENANT_ID = 'tenant_ypti'

async function getOdooConfig(tenantId: string): Promise<OdooConfig> {
  const ODOO_SETTING_KEYS = ['odoo_url', 'odoo_db', 'odoo_user', 'odoo_password', 'odoo_enabled']
  const settings = await db.systemSetting.findMany({
    where: {
      tenantId,
      key: { in: ODOO_SETTING_KEYS },
    },
  })

  const configMap: Record<string, string> = {}
  settings.forEach(setting => {
    configMap[setting.key] = setting.value
  })

  // Defaults from environment variables
  const defaults = {
    odoo_url: process.env.ODOO_URL || 'https://demo.odoo.com',
    odoo_db: process.env.ODOO_DB || 'demo',
    odoo_user: process.env.ODOO_USER || 'admin',
    odoo_password: process.env.ODOO_PASSWORD || 'admin',
    odoo_enabled: process.env.ODOO_ENABLED || 'false',
  }

  const merged = { ...defaults, ...configMap }
  return {
    baseUrl: merged.odoo_url,
    db: merged.odoo_db,
    username: merged.odoo_user,
    password: merged.odoo_password,
    enabled: merged.odoo_enabled === 'true',
  }
}

// GET /api/odoo/sync - Get recent sync logs
export async function GET(request: NextRequest) {
  try {
    const logs = await db.odooSyncLog.findMany({
      where: { tenantId: DEMO_TENANT_ID },
      orderBy: { syncedAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    console.error('Error fetching Odoo sync logs:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sync logs' },
      { status: 500 }
    )
  }
}

// POST /api/odoo/sync - Trigger sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, purchaseOrderId } = body

    // Fetch Odoo config from system settings
    const config = await getOdooConfig(DEMO_TENANT_ID)

    if (!config.enabled) {
      return NextResponse.json(
        { error: 'Odoo integration is disabled' },
        { status: 400 }
      )
    }

    let result
    let syncType = 'PURCHASE_ORDER'

    if (action === 'sync_purchase_orders') {
      result = await syncPurchaseOrdersToOdoo(DEMO_TENANT_ID, config)
      syncType = 'PURCHASE_ORDER'
    } else if (action === 'sync_goods_receipt' && purchaseOrderId) {
      result = await syncGoodsReceiptToOdoo(DEMO_TENANT_ID, purchaseOrderId, config)
      syncType = 'GOODS_RECEIPT'
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "sync_purchase_orders" or "sync_goods_receipt"' },
        { status: 400 }
      )
    }

    // Log the sync result
    const log = await db.odooSyncLog.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        syncType,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.success
          ? `Synced ${result.syncedCount} items`
          : result.errors.join('; '),
        details: JSON.stringify(result),
        odooPoId: body.odooPoId || null,
        odooReceiptId: body.odooReceiptId || null,
        syncedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      result,
      log,
    })
  } catch (error: any) {
    console.error('Error triggering Odoo sync:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}
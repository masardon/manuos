// Odoo Integration Service for ManuOS
// Handles one-way push sync for Purchase Orders and Goods Receipts

import { db } from '@/lib/db'

export interface OdooConfig {
  baseUrl: string
  db: string
  username: string
  password: string
  enabled: boolean
}

export interface OdooPurchaseOrder {
  id: number
  name: string
  partner_id: [number, string]
  date_order: string
  amount_total: number
  state: string
  order_line: OdooPOLine[]
}

export interface OdooPOLine {
  id: number
  product_id: [number, string]
  product_qty: number
  price_unit: number
  price_subtotal: number
}

export interface SyncResult {
  success: boolean
  syncedCount: number
  errors: string[]
  timestamp: Date
}

// Default Odoo configuration (would come from environment/settings)
const defaultConfig: OdooConfig = {
  baseUrl: process.env.ODOO_URL || 'https://demo.odoo.com',
  db: process.env.ODOO_DB || 'demo',
  username: process.env.ODOO_USER || 'admin',
  password: process.env.ODOO_PASSWORD || 'admin',
  enabled: process.env.ODOO_ENABLED === 'true'
}

/**
 * Odoo API Client (simplified - would use XML-RPC in production)
 */
class OdooClient {
  private config: OdooConfig

  constructor(config: OdooConfig = defaultConfig) {
    this.config = config
  }

  /**
   * Test connection to Odoo
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.enabled) {
      return { success: false, message: 'Odoo integration is disabled' }
    }
    
    try {
      // In production, this would make actual XML-RPC call
      // For now, return mock success
      return { success: true, message: 'Connection successful (mock)' }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` }
    }
  }

  /**
   * Create Purchase Order in Odoo (mock implementation)
   */
  async createPurchaseOrder(po: {
    partnerId: number
    orderDate: Date
    orderLines: Array<{
      productId: number
      quantity: number
      unitPrice: number
    }>
  }): Promise<{ odooId: number; name: string }> {
    // Mock implementation - would call Odoo XML-RPC API
    console.log('Creating PO in Odoo:', po)
    
    // Return mock Odoo PO data
    return {
      odooId: Math.floor(Math.random() * 10000),
      name: `PO/2025/${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`
    }
  }

  /**
   * Confirm Goods Receipt in Odoo (mock implementation)
   */
  async confirmGoodsReceipt(receiptId: number): Promise<{ success: boolean }> {
    console.log('Confirming goods receipt in Odoo:', receiptId)
    return { success: true }
  }
}

/**
 * Sync Purchase Orders from ManuOS to Odoo
 */
export async function syncPurchaseOrdersToOdoo(
  tenantId: string,
  config: OdooConfig = defaultConfig
): Promise<SyncResult> {
  const client = new OdooClient(config)
  const errors: string[] = []
  let syncedCount = 0

  try {
    // Get POs that haven't been synced yet
    const pendingPOs = await db.purchaseOrder.findMany({
      where: {
        tenantId,
        odooPoId: null,
        status: { in: ['APPROVED', 'SUBMITTED'] }
      },
      include: {
        supplier: true,
        items: true
      }
    })

    for (const po of pendingPOs) {
      try {
        // Map ManuOS PO to Odoo format
        const odooPO = {
          partnerId: parseInt(po.supplier.odooPartnerId || '1'), // Default partner
          orderDate: po.orderDate,
          orderLines: po.items.map(item => ({
            productId: 1, // Would map from product code
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }

        // Create in Odoo
        const odooResult = await client.createPurchaseOrder(odooPO)

        // Update ManuOS PO with Odoo reference
        await db.purchaseOrder.update({
          where: { id: po.id },
          data: {
            odooPoId: odooResult.odooId.toString(),
            odooSyncedAt: new Date()
          }
        })

        syncedCount++
        console.log(`Synced PO ${po.poNumber} to Odoo as ${odooResult.name}`)
      } catch (error) {
        errors.push(`Failed to sync PO ${po.poNumber}: ${error}`)
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
      timestamp: new Date()
    }
  } catch (error) {
    return {
      success: false,
      syncedCount: 0,
      errors: [`Sync failed: ${error}`],
      timestamp: new Date()
    }
  }
}

/**
 * Import Purchase Orders from Odoo to ManuOS
 * (Would be used for bidirectional sync in Phase 2)
 */
export async function importPurchaseOrdersFromOdoo(
  tenantId: string,
  config: OdooConfig = defaultConfig
): Promise<SyncResult> {
  // Mock implementation
  console.log('Importing POs from Odoo...')
  
  return {
    success: true,
    syncedCount: 0,
    errors: [],
    timestamp: new Date()
  }
}

/**
 * Sync Goods Receipt confirmation to Odoo
 */
export async function syncGoodsReceiptToOdoo(
  tenantId: string,
  purchaseOrderId: string,
  config: OdooConfig = defaultConfig
): Promise<SyncResult> {
  const client = new OdooClient(config)

  try {
    const po = await db.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,
        tenantId
      }
    })

    if (!po || !po.odooPoId) {
      return {
        success: false,
        syncedCount: 0,
        errors: ['PO not found or not linked to Odoo'],
        timestamp: new Date()
      }
    }

    // Confirm receipt in Odoo
    await client.confirmGoodsReceipt(parseInt(po.odooPoId))

    // Update PO status
    await db.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status: 'RECEIVED',
        receivedDate: new Date()
      }
    })

    return {
      success: true,
      syncedCount: 1,
      errors: [],
      timestamp: new Date()
    }
  } catch (error) {
    return {
      success: false,
      syncedCount: 0,
      errors: [`Receipt sync failed: ${error}`],
      timestamp: new Date()
    }
  }
}

export const odooClient = new OdooClient()

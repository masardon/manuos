// Odoo Integration Service for ManuOS
// Handles one-way push sync for Purchase Orders and Goods Receipts using XML-RPC

import { db } from '@/lib/db'
import { createClient, Client } from 'xmlrpc'

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
 * Odoo XML-RPC Client
 */
class OdooClient {
  private config: OdooConfig
  private commonClient: Client | null = null
  private objectClient: Client | null = null
  private uid: number | null = null

  constructor(config: OdooConfig = defaultConfig) {
    this.config = config
  }

  /**
   * Initialize XML-RPC clients
   */
  private initClients() {
    if (!this.commonClient) {
      this.commonClient = createClient({
        url: `${this.config.baseUrl}/xmlrpc/2/common`,
        allowNone: true
      })
    }
    if (!this.objectClient) {
      this.objectClient = createClient({
        url: `${this.config.baseUrl}/xmlrpc/2/object`,
        allowNone: true
      })
    }
  }

  /**
   * Authenticate with Odoo
   */
  async authenticate(): Promise<number> {
    if (!this.config.enabled) {
      throw new Error('Odoo integration is disabled')
    }

    this.initClients()

    return new Promise((resolve, reject) => {
      this.commonClient!.methodCall(
        'authenticate',
        [this.config.db, this.config.username, this.config.password, {}],
        (error: Error | null, value: number) => {
          if (error) {
            reject(new Error(`Authentication failed: ${error.message}`))
          } else if (!value) {
            reject(new Error('Authentication failed: Invalid credentials'))
          } else {
            this.uid = value
            resolve(value)
          }
        }
      )
    })
  }

  /**
   * Test connection to Odoo
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.enabled) {
      return { success: false, message: 'Odoo integration is disabled' }
    }
    
    try {
      const uid = await this.authenticate()
      return { success: true, message: `Connection successful (UID: ${uid})` }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` }
    }
  }

  /**
   * Execute Odoo model method
   */
  private async execute(
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {}
  ): Promise<unknown> {
    if (!this.uid) {
      await this.authenticate()
    }

    this.initClients()

    return new Promise((resolve, reject) => {
      this.objectClient!.methodCall(
        'execute_kw',
        [this.config.db, this.uid, this.config.password, model, method, args, kwargs],
        (error: Error | null, value: unknown) => {
          if (error) {
            reject(new Error(`Odoo method call failed: ${error.message}`))
          } else {
            resolve(value)
          }
        }
      )
    })
  }

  /**
   * Search and read records
   */
  private async searchRead(
    model: string,
    domain: unknown[][],
    fields: string[]
  ): Promise<unknown[]> {
    return this.execute(model, 'search_read', [domain], { fields }) as Promise<unknown[]>
  }

  /**
   * Create record
   */
  private async create(model: string, values: Record<string, unknown>): Promise<number> {
    return this.execute(model, 'create', [values]) as Promise<number>
  }

  /**
   * Write (update) record
   */
  private async write(
    model: string,
    ids: number[],
    values: Record<string, unknown>
  ): Promise<boolean> {
    return this.execute(model, 'write', [ids, values]) as Promise<boolean>
  }

  /**
   * Search records
   */
  private async search(model: string, domain: unknown[][]): Promise<number[]> {
    return this.execute(model, 'search', [domain]) as Promise<number[]>;
  }

  /**
   * Create Purchase Order in Odoo
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
    try {
      // Format date for Odoo
      const dateOrder = po.orderDate.toISOString().split('T')[0]

      // Create order lines
      const orderLines = po.orderLines.map(line => [
        0, 0, {
          product_id: line.productId,
          product_qty: line.quantity,
          price_unit: line.unitPrice,
        }
      ])

      // Create purchase order
      const values = {
        partner_id: po.partnerId,
        date_order: dateOrder,
        order_line: orderLines,
      }

      const odooId = await this.create('purchase.order', values)

      // Get the PO name
      const records = await this.searchRead(
        'purchase.order',
        [['id', '=', odooId]],
        ['name']
      )

      const name = records.length > 0 ? (records[0] as { name: string }).name : `PO/${odooId}`

      console.log(`Created PO in Odoo: ${name} (ID: ${odooId})`)
      
      return { odooId, name }
    } catch (error) {
      console.error('Failed to create PO in Odoo:', error)
      throw error
    }
  }

  /**
   * Confirm Goods Receipt in Odoo
   */
  async confirmGoodsReceipt(pickingId: number): Promise<{ success: boolean }> {
    try {
      // In Odoo, goods receipts are stock.picking records
      // We need to confirm the transfer
      await this.execute('stock.picking', 'button_validate', [[pickingId]])
      
      console.log(`Confirmed goods receipt in Odoo: Picking ${pickingId}`)
      return { success: true }
    } catch (error) {
      console.error('Failed to confirm goods receipt in Odoo:', error)
      throw error
    }
  }

  /**
   * Get supplier by Odoo partner ID or create if not exists
   */
  async getOrCreatePartner(name: string, odooPartnerId?: string): Promise<number> {
    if (odooPartnerId) {
      // Search for existing partner
      const partners = await this.searchRead(
        'res.partner',
        [['id', '=', parseInt(odooPartnerId)]],
        ['id']
      )
      
      if (partners.length > 0) {
        return (partners[0] as { id: number }).id
      }
    }

    // Create new partner
    const partnerId = await this.create('res.partner', {
      name,
      is_company: true,
      supplier_rank: 1
    })

    return partnerId
  }

  /**
   * Get product by internal reference or create if not exists
   */
  async getOrCreateProduct(
    name: string,
    defaultCode: string,
    price: number
  ): Promise<number> {
    // Search for existing product
    const products = await this.searchRead(
      'product.product',
      [['default_code', '=', defaultCode]],
      ['id']
    )
    
    if (products.length > 0) {
      return (products[0] as { id: number }).id
    }

    // Create new product
    const productId = await this.create('product.product', {
      name,
      default_code: defaultCode,
      list_price: price,
      purchase_ok: true,
      type: 'product'
    })

    return productId
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
    // Test connection first
    const connectionTest = await client.testConnection()
    if (!connectionTest.success) {
      return {
        success: false,
        syncedCount: 0,
        errors: [connectionTest.message],
        timestamp: new Date()
      }
    }

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
        // Get or create partner in Odoo
        const partnerId = await client.getOrCreatePartner(
          po.supplier.name,
          po.supplier.odooPartnerId || undefined
        )

        // Map ManuOS PO items to Odoo format
        const orderLines = []
        for (const item of po.items) {
          const productId = await client.getOrCreateProduct(
            item.name || 'Product',
            item.partNumber,
            item.unitPrice
          )
          orderLines.push({
            productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })
        }

        // Create PO in Odoo
        const odooResult = await client.createPurchaseOrder({
          partnerId,
          orderDate: po.orderDate,
          orderLines
        })

        // Update ManuOS PO with Odoo reference
        await db.purchaseOrder.update({
          where: { id: po.id },
          data: {
            odooPoId: odooResult.odooId.toString(),
            odooSyncedAt: new Date()
          }
        })

        // Also update supplier's Odoo partner ID if not set
        if (!po.supplier.odooPartnerId) {
          await db.supplier.update({
            where: { id: po.supplierId },
            data: { odooPartnerId: partnerId.toString() }
          })
        }

        syncedCount++
        console.log(`Synced PO ${po.poNumber} to Odoo as ${odooResult.name}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to sync PO ${po.poNumber}: ${errorMessage}`)
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
      timestamp: new Date()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      syncedCount: 0,
      errors: [`Sync failed: ${errorMessage}`],
      timestamp: new Date()
    }
  }
}

/**
 * Import Purchase Orders from Odoo to ManuOS
 */
export async function importPurchaseOrdersFromOdoo(
  tenantId: string,
  config: OdooConfig = defaultConfig
): Promise<SyncResult> {
  const client = new OdooClient(config)

  try {
    // Test connection first
    const connectionTest = await client.testConnection()
    if (!connectionTest.success) {
      return {
        success: false,
        syncedCount: 0,
        errors: [connectionTest.message],
        timestamp: new Date()
      }
    }

    // Get POs from Odoo that are not yet in ManuOS
    const odooPOs = await client.searchRead(
      'purchase.order',
      [['state', 'in', ['purchase', 'done']]],
      ['name', 'partner_id', 'date_order', 'amount_total', 'state']
    )

    let syncedCount = 0
    const errors: string[] = []

    for (const odooPO of odooPOs as Array<{
      id: number
      name: string
      partner_id: [number, string]
      date_order: string
      amount_total: number
      state: string
    }>) {
      try {
        // Check if PO already exists in ManuOS
        const existingPO = await db.purchaseOrder.findFirst({
          where: {
            tenantId,
            odooPoId: odooPO.id.toString()
          }
        })

        if (existingPO) {
          continue // Already imported
        }

        // Get or create supplier
        let supplier = await db.supplier.findFirst({
          where: {
            tenantId,
            odooPartnerId: odooPO.partner_id[0].toString()
          }
        })

        if (!supplier) {
          supplier = await db.supplier.create({
            data: {
              tenantId,
              code: `SUP-${Date.now()}`,
              name: odooPO.partner_id[1],
              odooPartnerId: odooPO.partner_id[0].toString(),
              supplierType: 'MATERIAL',
              isActive: true
            }
          })
        }

        // Get PO lines from Odoo
        const odooLines = await client.searchRead(
          'purchase.order.line',
          [['order_id', '=', odooPO.id]],
          ['product_id', 'product_qty', 'price_unit', 'price_subtotal']
        )

        // Create PO in ManuOS
        const po = await db.purchaseOrder.create({
          data: {
            tenantId,
            poNumber: odooPO.name,
            supplierId: supplier.id,
            orderDate: new Date(odooPO.date_order),
            totalAmount: odooPO.amount_total,
            status: odooPO.state === 'done' ? 'RECEIVED' : 'APPROVED',
            odooPoId: odooPO.id.toString(),
            odooSyncedAt: new Date()
          }
        })

        // Create PO items
        for (const line of odooLines as Array<{
          product_id: [number, string]
          product_qty: number
          price_unit: number
          price_subtotal: number
        }>) {
          await db.purchaseOrderItem.create({
            data: {
              tenantId,
              purchaseOrderId: po.id,
              partNumber: line.product_id[1].split(' ')[0] || 'UNKNOWN',
              name: line.product_id[1],
              quantity: line.product_qty,
              unitPrice: line.price_unit,
              totalPrice: line.price_subtotal
            }
          })
        }

        syncedCount++
        console.log(`Imported PO ${odooPO.name} from Odoo`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to import PO ${odooPO.name}: ${errorMessage}`)
      }
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
      timestamp: new Date()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      syncedCount: 0,
      errors: [`Import failed: ${errorMessage}`],
      timestamp: new Date()
    }
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

    // Test connection first
    const connectionTest = await client.testConnection()
    if (!connectionTest.success) {
      return {
        success: false,
        syncedCount: 0,
        errors: [connectionTest.message],
        timestamp: new Date()
      }
    }

    // Find the stock.picking record for this PO
    const pickings = await client.searchRead(
      'stock.picking',
      [
        ['purchase_id', '=', parseInt(po.odooPoId)],
        ['state', '=', 'assigned']
      ],
      ['id']
    )

    if (pickings.length > 0) {
      const pickingId = (pickings[0] as { id: number }).id
      await client.confirmGoodsReceipt(pickingId)
    }

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
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      syncedCount: 0,
      errors: [`Receipt sync failed: ${errorMessage}`],
      timestamp: new Date()
    }
  }
}

/**
 * Get Odoo configuration from system settings
 */
export async function getOdooConfig(tenantId: string): Promise<OdooConfig> {
  try {
    const settings = await db.systemSettings.findMany({
      where: {
        key: { startsWith: 'ODOO_' }
      }
    })

    const config: OdooConfig = {
      baseUrl: settings.find(s => s.key === 'ODOO_URL')?.value || defaultConfig.baseUrl,
      db: settings.find(s => s.key === 'ODOO_DB')?.value || defaultConfig.db,
      username: settings.find(s => s.key === 'ODOO_USER')?.value || defaultConfig.username,
      password: settings.find(s => s.key === 'ODOO_PASSWORD')?.value || defaultConfig.password,
      enabled: settings.find(s => s.key === 'ODOO_ENABLED')?.value === 'true'
    }

    return config
  } catch {
    return defaultConfig
  }
}

export const odooClient = new OdooClient()

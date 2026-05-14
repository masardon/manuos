// Real-time event system for inventory updates using Server-Sent Events

import { EventEmitter } from 'events'

// Event types
export interface InventoryEvent {
  type: 'INVENTORY_UPDATE' | 'RESERVATION_UPDATE' | 'ALLOCATION_UPDATE' | 'HANDOFF_UPDATE'
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  data: {
    id: string
    partNumber?: string
    quantity?: number
    locationId?: string
    shelfId?: string
    status?: string
    tenantId: string
    [key: string]: unknown
  }
  timestamp: Date
}

export interface InventoryUpdatePayload {
  inventoryId: string
  partNumber: string
  previousQuantity: number
  newQuantity: number
  changeType: 'ALLOCATION' | 'RETURN' | 'RECEIPT' | 'ADJUSTMENT' | 'TRANSFER'
  referenceId?: string
  referenceType?: string
  performedBy?: string
  tenantId: string
}

// Singleton event emitter
class InventoryEventEmitter extends EventEmitter {
  private static instance: InventoryEventEmitter
  private connections: Map<string, Response> = new Map()

  private constructor() {
    super()
    this.setMaxListeners(100) // Allow many listeners
  }

  static getInstance(): InventoryEventEmitter {
    if (!InventoryEventEmitter.instance) {
      InventoryEventEmitter.instance = new InventoryEventEmitter()
    }
    return InventoryEventEmitter.instance
  }

  /**
   * Register a new SSE connection
   */
  registerConnection(id: string, response: Response): void {
    this.connections.set(id, response)
    console.log(`SSE connection registered: ${id}. Total connections: ${this.connections.size}`)

    // Clean up on close
    response.signal.addEventListener('abort', () => {
      this.unregisterConnection(id)
    })
  }

  /**
   * Unregister a SSE connection
   */
  unregisterConnection(id: string): void {
    this.connections.delete(id)
    console.log(`SSE connection unregistered: ${id}. Total connections: ${this.connections.size}`)
  }

  /**
   * Emit inventory update event
   */
  emitInventoryUpdate(payload: InventoryUpdatePayload): void {
    const event: InventoryEvent = {
      type: 'INVENTORY_UPDATE',
      action: 'UPDATE',
      data: {
        id: payload.inventoryId,
        partNumber: payload.partNumber,
        quantity: payload.newQuantity,
        tenantId: payload.tenantId,
        changeType: payload.changeType,
        previousQuantity: payload.previousQuantity
      },
      timestamp: new Date()
    }

    this.emit('inventory:update', event)
    console.log(`Inventory update emitted: ${payload.partNumber} (${payload.previousQuantity} -> ${payload.newQuantity})`)
  }

  /**
   * Emit reservation update event
   */
  emitReservationUpdate(data: {
    reservationId: string
    inventoryId: string
    partNumber: string
    quantity: number
    status: string
    tenantId: string
    action: 'CREATE' | 'UPDATE' | 'DELETE'
  }): void {
    const event: InventoryEvent = {
      type: 'RESERVATION_UPDATE',
      action: data.action,
      data: {
        id: data.reservationId,
        partNumber: data.partNumber,
        quantity: data.quantity,
        status: data.status,
        tenantId: data.tenantId
      },
      timestamp: new Date()
    }

    this.emit('reservation:update', event)
  }

  /**
   * Emit allocation update event
   */
  emitAllocationUpdate(data: {
    allocationId: string
    jobsheetMaterialId: string
    inventoryId: string
    partNumber: string
    quantity: number
    status: string
    tenantId: string
    action: 'CREATE' | 'UPDATE' | 'DELETE'
  }): void {
    const event: InventoryEvent = {
      type: 'ALLOCATION_UPDATE',
      action: data.action,
      data: {
        id: data.allocationId,
        partNumber: data.partNumber,
        quantity: data.quantity,
        status: data.status,
        tenantId: data.tenantId
      },
      timestamp: new Date()
    }

    this.emit('allocation:update', event)
  }

  /**
   * Emit handoff update event
   */
  emitHandoffUpdate(data: {
    handoffId: string
    handoffNumber: string
    status: string
    tenantId: string
    action: 'CREATE' | 'UPDATE' | 'DELETE'
  }): void {
    const event: InventoryEvent = {
      type: 'HANDOFF_UPDATE',
      action: data.action,
      data: {
        id: data.handoffId,
        handoffNumber: data.handoffNumber,
        status: data.status,
        tenantId: data.tenantId
      },
      timestamp: new Date()
    }

    this.emit('handoff:update', event)
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size
  }
}

// Export singleton instance
export const inventoryEventEmitter = InventoryEventEmitter.getInstance()

/**
 * Create SSE response stream
 */
export function createSSEStream(tenantId?: string): ReadableStream {
  const encoder = new TextEncoder()
  let connectionId = `sse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const data = JSON.stringify({
        type: 'CONNECTED',
        connectionId,
        timestamp: new Date().toISOString()
      })
      controller.enqueue(`data: ${data}\n\n`)

      // Store the controller for later use
      const response = {
        signal: { addEventListener: () => {} },
        controller
      } as unknown as Response

      inventoryEventEmitter.registerConnection(connectionId, response)

      // Set up event listeners
      const onInventoryUpdate = (event: InventoryEvent) => {
        if (!tenantId || event.data.tenantId === tenantId) {
          const data = JSON.stringify(event)
          try {
            controller.enqueue(`data: ${data}\n\nevent: ${event.type}\n`)
          } catch {
            // Stream closed
          }
        }
      }

      const onReservationUpdate = (event: InventoryEvent) => {
        if (!tenantId || event.data.tenantId === tenantId) {
          const data = JSON.stringify(event)
          try {
            controller.enqueue(`data: ${data}\n\nevent: ${event.type}\n`)
          } catch {
            // Stream closed
          }
        }
      }

      const onAllocationUpdate = (event: InventoryEvent) => {
        if (!tenantId || event.data.tenantId === tenantId) {
          const data = JSON.stringify(event)
          try {
            controller.enqueue(`data: ${data}\n\nevent: ${event.type}\n`)
          } catch {
            // Stream closed
          }
        }
      }

      const onHandoffUpdate = (event: InventoryEvent) => {
        if (!tenantId || event.data.tenantId === tenantId) {
          const data = JSON.stringify(event)
          try {
            controller.enqueue(`data: ${data}\n\nevent: ${event.type}\n`)
          } catch {
            // Stream closed
          }
        }
      }

      // Register event listeners
      inventoryEventEmitter.on('inventory:update', onInventoryUpdate)
      inventoryEventEmitter.on('reservation:update', onReservationUpdate)
      inventoryEventEmitter.on('allocation:update', onAllocationUpdate)
      inventoryEventEmitter.on('handoff:update', onHandoffUpdate)

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = JSON.stringify({
            type: 'HEARTBEAT',
            timestamp: new Date().toISOString()
          })
          controller.enqueue(`data: ${heartbeat}\n\n`)
        } catch {
          clearInterval(heartbeatInterval)
        }
      }, 30000)

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeatInterval)
        inventoryEventEmitter.off('inventory:update', onInventoryUpdate)
        inventoryEventEmitter.off('reservation:update', onReservationUpdate)
        inventoryEventEmitter.off('allocation:update', onAllocationUpdate)
        inventoryEventEmitter.off('handoff:update', onHandoffUpdate)
        inventoryEventEmitter.unregisterConnection(connectionId)
      }

      // Listen for abort signal
      controller.enqueue = new Proxy(controller.enqueue, {
        apply(target, thisArg, args) {
          try {
            return Reflect.apply(target, thisArg, args)
          } catch {
            cleanup()
            throw new Error('Stream closed')
          }
        }
      })
    },

    cancel() {
      inventoryEventEmitter.unregisterConnection(connectionId)
    }
  })

  return stream
}

/**
 * Helper function to send SSE headers
 */
export function getSSEHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  }
}

/**
 * Helper function to format SSE message
 */
export function formatSSEMessage(event: InventoryEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

/**
 * Helper function to format SSE heartbeat
 */
export function formatSSEHeartbeat(): string {
  return `data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: new Date().toISOString() })}\n\n`
}

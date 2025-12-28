// WMS WebSocket Hook - Real-time warehouse updates
// Integrates WebSocket with React components for live updates

import { useEffect, useRef, useState, useCallback } from 'react'
import { WmsWebSocketClient } from '@/lib/websocket/wms-websocket'

interface WmsWebSocketHook {
  isConnected: boolean
  subscribeWarehouse: (siteId: string, tenantId: string) => void
  subscribeInventory: (siteId: string, binId?: string, itemId?: string) => void
  subscribeTasks: (siteId: string, userId?: string) => void
  subscribe3D: (siteId: string, tiles: string[]) => void
  onInventoryUpdate: (callback: (data: any) => void) => void
  onTaskUpdate: (callback: (data: any) => void) => void
  onOrderUpdate: (callback: (data: any) => void) => void
  onWarehouseUpdate: (callback: (data: any) => void) => void
  onAlert: (callback: (data: any) => void) => void
  disconnect: () => void
}

export function useWmsWebSocket(url?: string): WmsWebSocketHook {
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<WmsWebSocketClient | null>(null)
  const callbacksRef = useRef<Map<string, Function[]>>(new Map())

  useEffect(() => {
    const wsUrl = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    
    clientRef.current = new WmsWebSocketClient(wsUrl)
    
    // Set up connection handlers
    clientRef.current.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to WMS WebSocket')
    })

    clientRef.current.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from WMS WebSocket')
    })

    // Set up event handlers
    clientRef.current.on('inventory-updated', (data) => {
      const callbacks = callbacksRef.current.get('inventory-updated') || []
      callbacks.forEach(callback => callback(data))
    })

    clientRef.current.on('task-updated', (data) => {
      const callbacks = callbacksRef.current.get('task-updated') || []
      callbacks.forEach(callback => callback(data))
    })

    clientRef.current.on('order-updated', (data) => {
      const callbacks = callbacksRef.current.get('order-updated') || []
      callbacks.forEach(callback => callback(data))
    })

    clientRef.current.on('warehouse-updated', (data) => {
      const callbacks = callbacksRef.current.get('warehouse-updated') || []
      callbacks.forEach(callback => callback(data))
    })

    clientRef.current.on('alert', (data) => {
      const callbacks = callbacksRef.current.get('alert') || []
      callbacks.forEach(callback => callback(data))
    })

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect()
      }
    }
  }, [url])

  const subscribeWarehouse = useCallback((siteId: string, tenantId: string) => {
    if (clientRef.current) {
      clientRef.current.subscribeWarehouse(siteId, tenantId)
    }
  }, [])

  const subscribeInventory = useCallback((siteId: string, binId?: string, itemId?: string) => {
    if (clientRef.current) {
      clientRef.current.subscribeInventory(siteId, binId, itemId)
    }
  }, [])

  const subscribeTasks = useCallback((siteId: string, userId?: string) => {
    if (clientRef.current) {
      clientRef.current.subscribeTasks(siteId, userId)
    }
  }, [])

  const subscribe3D = useCallback((siteId: string, tiles: string[]) => {
    if (clientRef.current) {
      clientRef.current.subscribe3D(siteId, tiles)
    }
  }, [])

  const onInventoryUpdate = useCallback((callback: (data: any) => void) => {
    if (!callbacksRef.current.has('inventory-updated')) {
      callbacksRef.current.set('inventory-updated', [])
    }
    callbacksRef.current.get('inventory-updated')!.push(callback)
  }, [])

  const onTaskUpdate = useCallback((callback: (data: any) => void) => {
    if (!callbacksRef.current.has('task-updated')) {
      callbacksRef.current.set('task-updated', [])
    }
    callbacksRef.current.get('task-updated')!.push(callback)
  }, [])

  const onOrderUpdate = useCallback((callback: (data: any) => void) => {
    if (!callbacksRef.current.has('order-updated')) {
      callbacksRef.current.set('order-updated', [])
    }
    callbacksRef.current.get('order-updated')!.push(callback)
  }, [])

  const onWarehouseUpdate = useCallback((callback: (data: any) => void) => {
    if (!callbacksRef.current.has('warehouse-updated')) {
      callbacksRef.current.set('warehouse-updated', [])
    }
    callbacksRef.current.get('warehouse-updated')!.push(callback)
  }, [])

  const onAlert = useCallback((callback: (data: any) => void) => {
    if (!callbacksRef.current.has('alert')) {
      callbacksRef.current.set('alert', [])
    }
    callbacksRef.current.get('alert')!.push(callback)
  }, [])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect()
    }
  }, [])

  return {
    isConnected,
    subscribeWarehouse,
    subscribeInventory,
    subscribeTasks,
    subscribe3D,
    onInventoryUpdate,
    onTaskUpdate,
    onOrderUpdate,
    onWarehouseUpdate,
    onAlert,
    disconnect
  }
}



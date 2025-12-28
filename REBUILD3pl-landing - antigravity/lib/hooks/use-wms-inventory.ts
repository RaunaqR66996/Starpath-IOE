// WMS Inventory Hook - Real-time inventory management
// Integrates inventory APIs with React components

import { useState, useEffect, useCallback } from 'react'
import { useWmsWebSocket } from './use-wms-websocket'

interface InventoryItem {
  id: string
  siteId: string
  binId: string
  itemId: string
  quantity: number
  status: 'AVAILABLE' | 'RESERVED' | 'ALLOCATED' | 'PICKED' | 'SHIPPED' | 'DAMAGED' | 'QUARANTINE' | 'HOLD'
  item: {
    sku: string
    description: string
    dimensions: any
    attributes: any
  }
  bin: {
    name: string
    coordinates: any
    capacity: any
  }
  lastUpdated: string
}

interface InventorySummary {
  status: string
  _sum: { quantity: number }
  _count: { id: number }
}

interface UseWmsInventoryOptions {
  siteId: string
  binId?: string
  itemId?: string
  status?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useWmsInventory(options: UseWmsInventoryOptions) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState<InventorySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    subscribeInventory, 
    onInventoryUpdate, 
    isConnected 
  } = useWmsWebSocket()

  // Fetch inventory data
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        siteId: options.siteId,
        ...(options.binId && { binId: options.binId }),
        ...(options.itemId && { itemId: options.itemId }),
        ...(options.status && { status: options.status })
      })

      const response = await fetch(`/api/wms/inventory?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        setInventory(data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch inventory')
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
    } finally {
      setLoading(false)
    }
  }, [options.siteId, options.binId, options.itemId, options.status])

  // Fetch inventory summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/wms/inventory/summary?siteId=${options.siteId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory summary: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        setSummary(data.data)
      }
    } catch (err) {
      console.error('Error fetching inventory summary:', err)
    }
  }, [options.siteId])

  // Adjust inventory
  const adjustInventory = useCallback(async (
    binId: string,
    itemId: string,
    quantity: number,
    reason: string,
    actorId: string,
    tenantId: string
  ) => {
    try {
      const response = await fetch('/api/wms/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siteId: options.siteId,
          binId,
          itemId,
          quantity,
          reason,
          actorId,
          tenantId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to adjust inventory: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        // Refresh inventory after successful adjustment
        await fetchInventory()
        return data.data
      } else {
        throw new Error(data.message || 'Failed to adjust inventory')
      }
    } catch (err) {
      console.error('Error adjusting inventory:', err)
      throw err
    }
  }, [options.siteId, fetchInventory])

  // Set up WebSocket subscription
  useEffect(() => {
    if (isConnected) {
      subscribeInventory(options.siteId, options.binId, options.itemId)
    }
  }, [isConnected, subscribeInventory, options.siteId, options.binId, options.itemId])

  // Set up real-time updates
  useEffect(() => {
    const handleInventoryUpdate = (data: any) => {
      console.log('Inventory updated:', data)
      // Refresh inventory when real-time updates arrive
      fetchInventory()
    }

    onInventoryUpdate(handleInventoryUpdate)
  }, [onInventoryUpdate, fetchInventory])

  // Initial data fetch
  useEffect(() => {
    fetchInventory()
    fetchSummary()
  }, [fetchInventory, fetchSummary])

  // Auto-refresh if enabled
  useEffect(() => {
    if (!options.autoRefresh) return

    const interval = setInterval(() => {
      fetchInventory()
      fetchSummary()
    }, options.refreshInterval || 30000) // Default 30 seconds

    return () => clearInterval(interval)
  }, [options.autoRefresh, options.refreshInterval, fetchInventory, fetchSummary])

  return {
    inventory,
    summary,
    loading,
    error,
    fetchInventory,
    fetchSummary,
    adjustInventory,
    isConnected
  }
}


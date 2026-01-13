"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInventory } from "@/app/actions/inventory"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface InventoryItem {
  id: string
  sku: string
  description: string
  bin: string
  quantity: number
  status: string
}

export function InventoryTracking({ siteId }: { siteId: string }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchInventory = async () => {
    try {
      const data = await getInventory(siteId)
      const mappedInventory = data.map((item: any) => ({
        id: item.id,
        sku: item.item?.sku || 'Unknown SKU',
        description: item.item?.description || 'No Description',
        bin: item.location?.name || 'Unknown Bin',
        quantity: item.quantity,
        status: item.status
      }))
      setInventory(mappedInventory)
    } catch (error) {
      console.error("Failed to fetch inventory", error)
      toast.error("Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [siteId])

  const filteredInventory = inventory.filter(item => {
    return statusFilter === 'all' || item.status === statusFilter
  })

  const getInventoryVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success'
      case 'RESERVED': return 'secondary'
      case 'LOW_STOCK': return 'warning'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Inventory Tracking ({inventory.length})</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-5 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        {filteredInventory.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-500">
            No inventory found. Receive items to add stock!
          </div>
        ) : (
          filteredInventory.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="text-xs font-medium">{item.bin}</div>
                  <div className="text-xs text-gray-600 truncate">{item.sku}</div>
                  <Badge variant={getInventoryVariant(item.status) as any} className="text-xs px-1 py-0">
                    {item.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0">{item.quantity}</div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{item.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

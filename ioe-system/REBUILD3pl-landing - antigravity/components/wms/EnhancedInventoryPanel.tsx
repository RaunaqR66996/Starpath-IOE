// Enhanced Inventory Panel with Real-time Updates
// Integrates with WMS APIs and WebSocket for live inventory management

"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  MapPin, 
  Box, 
  Search, 
  Edit, 
  Move, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react'
import { useWmsInventory } from '@/lib/hooks/use-wms-inventory'
import { AISlottingSuggestions } from './AISlottingSuggestions'

interface EnhancedInventoryPanelProps {
  siteId: string
  selectedBinId?: string
  onBinSelect?: (binId: string) => void
  onInventoryUpdate?: (inventory: any) => void
}

export function EnhancedInventoryPanel({ 
  siteId, 
  selectedBinId, 
  onBinSelect, 
  onInventoryUpdate 
}: EnhancedInventoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAI, setShowAI] = useState(false)
  const [adjustmentModal, setAdjustmentModal] = useState<{
    open: boolean
    itemId?: string
    binId?: string
    currentQuantity?: number
  }>({ open: false })

  // Use WMS inventory hook for real-time data
  const {
    inventory,
    summary,
    loading,
    error,
    fetchInventory,
    adjustInventory,
    isConnected
  } = useWmsInventory({
    siteId,
    binId: selectedBinId,
    autoRefresh: true,
    refreshInterval: 30000
  })

  // Filter inventory based on search and status
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bin.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Handle inventory adjustment
  const handleAdjustment = useCallback(async (
    itemId: string,
    binId: string,
    adjustment: number,
    reason: string
  ) => {
    try {
      await adjustInventory(
        binId,
        itemId,
        adjustment,
        reason,
        'current-user', // TODO: Get from auth context
        'default-tenant' // TODO: Get from auth context
      )
      
      setAdjustmentModal({ open: false })
      onInventoryUpdate?.(inventory)
    } catch (err) {
      console.error('Error adjusting inventory:', err)
    }
  }, [adjustInventory, inventory, onInventoryUpdate])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800'
      case 'ALLOCATED': return 'bg-blue-100 text-blue-800'
      case 'PICKED': return 'bg-purple-100 text-purple-800'
      case 'SHIPPED': return 'bg-gray-100 text-gray-800'
      case 'DAMAGED': return 'bg-red-100 text-red-800'
      case 'QUARANTINE': return 'bg-orange-100 text-orange-800'
      case 'HOLD': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Live updates enabled</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Offline mode</span>
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summary.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.status}
                  </p>
                  <p className="text-2xl font-bold">{item._sum.quantity}</p>
                </div>
                <Badge className={getStatusColor(item.status)}>
                  {item._count.id} items
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="ALLOCATED">Allocated</SelectItem>
            <SelectItem value="PICKED">Picked</SelectItem>
            <SelectItem value="DAMAGED">Damaged</SelectItem>
            <SelectItem value="QUARANTINE">Quarantine</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAI(!showAI)}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {showAI ? 'Hide' : 'Show'} AI
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInventory}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* AI Slotting Suggestions */}
      {showAI && (
        <AISlottingSuggestions
          siteId={siteId}
          onSuggestionApply={(suggestion) => {
            console.log('Applied suggestion:', suggestion)
            fetchInventory()
          }}
          onSuggestionReject={(suggestion) => {
            console.log('Rejected suggestion:', suggestion)
          }}
        />
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchInventory}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No inventory items found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredInventory.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedBinId === item.binId ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onBinSelect?.(item.binId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.bin.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.item.sku}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.item.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{item.quantity}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.bin.capacity?.max ? 
                            `${Math.round((item.quantity / item.bin.capacity.max) * 100)}% capacity` : 
                            'No capacity limit'
                          }
                        </div>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setAdjustmentModal({
                              open: true,
                              itemId: item.itemId,
                              binId: item.binId,
                              currentQuantity: item.quantity
                            })
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Modal */}
      {adjustmentModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Adjust Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Quantity</Label>
                <Input 
                  value={adjustmentModal.currentQuantity} 
                  disabled 
                />
              </div>
              <div>
                <Label>Adjustment Amount</Label>
                <Input 
                  type="number"
                  placeholder="Enter positive or negative number"
                />
              </div>
              <div>
                <Label>Reason</Label>
                <Input 
                  placeholder="Enter reason for adjustment"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setAdjustmentModal({ open: false })}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // TODO: Implement adjustment logic
                    setAdjustmentModal({ open: false })
                  }}
                >
                  Apply Adjustment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}


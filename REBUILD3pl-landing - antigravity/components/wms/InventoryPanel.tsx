"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Loader2
} from 'lucide-react'

interface BinContents {
  id: string
  type: string
  zone: string
  aisle: string
  bay: string
  level: string
  position: {
    x: number
    y: number
    z: number
  }
  dimensions: {
    length: number
    width: number
    height: number
  }
  capacity: {
    max: number
    used: number
    available: number
    utilization: number
  }
  restrictions?: string
  contents: Array<{
    id: string
    sku: string
    name: string
    description: string
    lot?: string
    serial?: string
    qtyOnHand: number
    qtyAllocated: number
    qtyAvailable: number
    status: string
    lastCounted?: string
    handlingUnit?: {
      id: string
      type: string
      weight: number
      dimensions: {
        length: number
        width: number
        height: number
      }
    }
  }>
}

interface InventoryItem {
  id: string
  sku: string
  name: string
  description: string
  lot?: string
  serial?: string
  qtyOnHand: number
  qtyAllocated: number
  qtyAvailable: number
  status: string
  location: {
    id: string
    type: string
    zone?: string
    aisle?: string
    bay?: string
    level?: string
    capacity: number
  }
  handlingUnit?: {
    id: string
    type: string
  }
}

interface HandlingUnit {
  id: string
  type: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  status: string
  contents: Array<{
    sku: string
    name: string
    qty: number
    lot?: string
    serial?: string
  }>
}

interface InventoryPanelProps {
  siteId: string
  selectedBinId?: string
  isOpen: boolean
  onClose: () => void
  onBinSelect?: (binId: string) => void
  isReadOnly?: boolean
}

export function InventoryPanel({ 
  siteId, 
  selectedBinId, 
  isOpen, 
  onClose, 
  onBinSelect,
  isReadOnly = false 
}: InventoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'bin' | 'item' | 'hu'>('bin')
  const [binData, setBinData] = useState<BinContents | null>(null)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [handlingUnits, setHandlingUnits] = useState<HandlingUnit[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen && siteId) {
      if (activeTab === 'bin' && selectedBinId) {
        fetchBinData(selectedBinId)
      } else if (activeTab === 'item') {
        fetchInventoryItems()
      } else if (activeTab === 'hu') {
        fetchHandlingUnits()
      }
    }
  }, [isOpen, siteId, activeTab, selectedBinId])

  const fetchBinData = async (binId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/wms/${siteId}/bin/${binId}`)
      const data = await response.json()

      if (data.success) {
        setBinData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch bin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInventoryItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/wms/${siteId}/inventory`)
      const data = await response.json()

      if (data.success) {
        setInventoryItems(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHandlingUnits = async () => {
    try {
      setLoading(true)
      // Mock data for now - would need a real API endpoint
      setHandlingUnits([])
    } catch (error) {
      console.error('Failed to fetch handling units:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'BLOCKED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'QUARANTINE':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'BLOCKED':
        return 'bg-red-100 text-red-800'
      case 'QUARANTINE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLocation = (location: any) => {
    const parts = [location.zone, location.aisle, location.bay, location.level].filter(Boolean)
    return parts.join('-') || 'Unknown'
  }

  const filteredInventoryItems = inventoryItems.filter(item =>
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.lot && item.lot.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.serial && item.serial.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (!isOpen) return null

  return (
    <Card className="uber-card w-96 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="uber-heading-3">Inventory</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'bin' | 'item' | 'hu')}>
          <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
            <TabsTrigger value="bin" className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>Bin</span>
            </TabsTrigger>
            <TabsTrigger value="item" className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span>Item</span>
            </TabsTrigger>
            <TabsTrigger value="hu" className="flex items-center space-x-1">
              <Box className="h-3 w-3" />
              <span>HU</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bin" className="px-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : binData ? (
              <>
                {/* Bin Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {formatLocation(binData)}
                    </h3>
                    <Badge variant="outline">
                      {binData.type}
                    </Badge>
                  </div>
                  
                  {/* Capacity Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Capacity</span>
                      <span>{binData.capacity.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          binData.capacity.utilization > 80 ? 'bg-red-500' :
                          binData.capacity.utilization > 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(binData.capacity.utilization, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{binData.capacity.used} used</span>
                      <span>{binData.capacity.available} available</span>
                    </div>
                  </div>
                </div>

                {/* Bin Contents */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Contents</h4>
                  {binData.contents.length === 0 ? (
                    <p className="text-sm text-gray-500">No items in this bin</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {binData.contents.map((item) => (
                        <div key={item.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{item.sku}</p>
                              <p className="text-xs text-gray-600">{item.name}</p>
                            </div>
                            {getStatusIcon(item.status)}
                          </div>
                          
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>On Hand:</span>
                              <span>{item.qtyOnHand}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Allocated:</span>
                              <span>{item.qtyAllocated}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Available:</span>
                              <span>{item.qtyAvailable}</span>
                            </div>
                            {item.lot && (
                              <div className="flex justify-between">
                                <span>Lot:</span>
                                <span>{item.lot}</span>
                              </div>
                            )}
                            {item.serial && (
                              <div className="flex justify-between">
                                <span>Serial:</span>
                                <span>{item.serial}</span>
                              </div>
                            )}
                          </div>

                          {!isReadOnly && (
                            <div className="flex space-x-1 mt-2">
                              <Button size="sm" variant="outline" className="flex-1">
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                <Move className="h-3 w-3 mr-1" />
                                Move
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Select a bin to view contents</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="item" className="px-4 space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="item-search">Search Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="item-search"
                  placeholder="Search by SKU, name, lot, serial..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 uber-input"
                />
              </div>
            </div>

            {/* Items List */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredInventoryItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchQuery ? 'No items found' : 'No inventory items'}
                  </p>
                ) : (
                  filteredInventoryItems.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{item.sku}</p>
                          <p className="text-xs text-gray-600">{item.name}</p>
                        </div>
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span>{formatLocation(item.location)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>On Hand:</span>
                          <span>{item.qtyOnHand}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available:</span>
                          <span>{item.qtyAvailable}</span>
                        </div>
                      </div>

                      {!isReadOnly && (
                        <div className="flex space-x-1 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => onBinSelect?.(item.location.id)}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            View Bin
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hu" className="px-4 space-y-4">
            <div className="text-center py-8">
              <Box className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">Handling Units coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}








































































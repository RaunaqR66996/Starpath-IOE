"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  Filter,
  Download,
  Package,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Eye,
  Play,
  Loader2,
  FileText,
  ExternalLink
} from 'lucide-react'
import { ERPNextBadge } from '@/components/ui/erpnext-badge'
import { ERPNextLink } from '@/components/ui/erpnext-link'
import { orderService } from '@/lib/services/order-service'
import { getShipments, getShipmentDetails, getPackingSlipDetails, getPickTicketDetails } from '@/app/actions/shipments'
import { PDFGenerator } from '@/lib/utils/pdf-generator'
import { Order, OrderStatus } from '@/types/order'
import { Shipment } from '@/types/shipment'
import Link from 'next/link'
import { OrderEntry } from '@/components/tms/orders/OrderEntry'
import { OrderImport } from '@/components/tms/orders/OrderImport'
import { OrderConsolidation } from '@/components/tms/orders/OrderConsolidation'
import { ShipmentCreation } from '@/components/tms/orders/ShipmentCreation'
import { OrderTracking } from '@/components/tms/orders/OrderTracking'
import { OrderModification } from '@/components/tms/orders/OrderModification'

import { getOrders } from '@/app/actions/orders'
import { createLoad } from '@/app/actions/tms'
import { toast } from 'sonner'

// ... existing imports

export function TMSOrders() {
  const searchParams = useSearchParams()
  const submoduleParam = searchParams?.get('submodule')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingLoad, setCreatingLoad] = useState(false)

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getOrders()
      setOrders(fetchedOrders as any) // Type assertion due to partial mapping

      // Get all shipments
      const allShipments = await getShipments()
      setShipments(allShipments)
    } catch (error) {
      console.error('Failed to load orders', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const getStatusColor = (status: OrderStatus | string) => {
    switch (status) {
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'planned': return 'bg-yellow-100 text-yellow-800'
      case 'tendered': return 'bg-purple-100 text-purple-800'
      case 'in_transit': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'STAGED': return 'bg-orange-100 text-orange-800'
      case 'LOAD_PLANNED': return 'bg-indigo-100 text-indigo-800'
      case 'ALLOCATED': return 'bg-teal-100 text-teal-800'
      case 'BACKORDER': return 'bg-red-100 text-red-800'
      case 'PLANNED': return 'bg-indigo-100 text-indigo-800'
      case 'CREATED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      case 'rush': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const getOrderShipment = (orderId: string): Shipment | undefined => {
    return shipments.find(shipment => shipment.orderId === orderId)
  }

  const handleCreateLoad = async () => {
    if (selectedOrders.length === 0) return

    setCreatingLoad(true)
    try {
      const result = await createLoad(selectedOrders)
      if (result.success) {
        toast.success(`Load created with ${selectedOrders.length} orders`)
        setSelectedOrders([])
        fetchOrders()
      } else {
        toast.error('Failed to create load')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setCreatingLoad(false)
    }
  }

  const handleDownloadBOL = async (shipmentId: string) => {
    try {
      const details = await getShipmentDetails(shipmentId)
      if (!details) {
        toast.error('Failed to load shipment details')
        return
      }

      const pdfBlob = PDFGenerator.generateBOL(details)
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `BOL-${details.bolNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('BOL PDF downloaded')
    } catch (error) {
      console.error('BOL Generation Error:', error)
      toast.error('Failed to generate BOL')
    }
  }

  const handleDownloadPackingSlip = async (shipmentId: string) => {
    try {
      const details = await getPackingSlipDetails(shipmentId)
      if (!details) {
        toast.error('Failed to load packing slip details')
        return
      }

      const pdfBlob = PDFGenerator.generatePackingSlip(details)
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `PackingSlip-${details.bolNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Packing Slip PDF downloaded')
    } catch (error) {
      console.error('Packing Slip Generation Error:', error)
      toast.error('Failed to generate Packing Slip')
    }
  }

  const handleDownloadPickTicket = async (orderId: string) => {
    try {
      const details = await getPickTicketDetails(orderId)
      if (!details) {
        toast.error('Failed to load pick ticket details')
        return
      }

      const pdfBlob = PDFGenerator.generatePickTicket(details)
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `PickTicket-${details.orderNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Pick Ticket PDF downloaded')
    } catch (error) {
      console.error('Pick Ticket Generation Error:', error)
      toast.error('Failed to generate Pick Ticket')
    }
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(order => order.id))
    }
  }

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerDetails.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerDetails.addresses.shipping.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerDetails.addresses.shipping.state.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Render sub-modules based on query param
  if (submoduleParam === 'entry') {
    return <OrderEntry />
  }
  if (submoduleParam === 'import') {
    return <OrderImport />
  }
  if (submoduleParam === 'consolidation') {
    return <OrderConsolidation />
  }
  if (submoduleParam === 'shipment-creation') {
    return <ShipmentCreation />
  }
  if (submoduleParam === 'tracking') {
    return <OrderTracking />
  }
  if (submoduleParam === 'modification') {
    return <OrderModification />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="text-sp-text-muted">Loading orders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {selectedOrders.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateLoad}
              disabled={creatingLoad}
            >
              {creatingLoad ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              Create Load ({selectedOrders.length})
            </Button>
          )}
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Orders & Shipments</span>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              <span className="text-sm text-gray-500">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="text-left p-2 font-medium">Order ID</th>
                  <th className="text-left p-2 font-medium">Customer</th>
                  <th className="text-left p-2 font-medium">Route</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Priority</th>
                  <th className="text-left p-2 font-medium">Value</th>
                  <th className="text-left p-2 font-medium">Weight</th>
                  <th className="text-left p-2 font-medium">Carrier</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const shipment = getOrderShipment(order.id)
                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-2 font-medium text-sp-accent">
                        <div className="flex items-center gap-2">
                          <Link href={`/orders/${order.id}`} className="hover:underline">
                            {order.orderNumber}
                          </Link>
                          {(order as any).isERPNextOrder && (
                            <ERPNextBadge 
                              orderNumber={(order as any).erpnextOrderNumber} 
                              className="text-xs"
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-2">{order.customerDetails.customer.name}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-sp-text-muted" />
                          <span>{order.customerDetails.addresses.shipping.city}, {order.customerDetails.addresses.shipping.state}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusColor(shipment?.status || order.status)}>
                          {shipment?.status || order.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </td>
                      <td className="p-2 font-medium">{formatCurrency(order.financials.totalAmount)}</td>
                      <td className="p-2">
                        {shipment?.packages?.[0]?.weightKg
                          ? `${shipment.packages[0].weightKg.toFixed(1)} kg`
                          : 'TBD'
                        }
                      </td>
                      <td className="p-2">
                        {shipment?.carrier ? (
                          <span className="text-sm">{shipment.carrier}</span>
                        ) : (
                          <span className="text-sm text-sp-text-muted">Not assigned</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {(order as any).isERPNextOrder && (
                            <ERPNextLink 
                              doctype="sales-order" 
                              docname={(order as any).erpnextOrderNumber}
                              label=""
                              variant="ghost"
                            />
                          )}
                          {order.status === 'STAGED' && !shipment && (
                            <Button variant="ghost" size="sm" onClick={() => handleCreateLoad()}>
                              <Truck className="h-4 w-4 text-indigo-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Panel */}
      {selectedOrders.length === 1 && (() => {
        const selectedOrder = orders.find(order => order.id === selectedOrders[0])
        const shipment = selectedOrder ? getOrderShipment(selectedOrder.id) : null

        if (!selectedOrder) return null

        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Details - {selectedOrder.orderNumber}</span>
                {(selectedOrder as any).isERPNextOrder && (
                  <ERPNextBadge 
                    orderNumber={(selectedOrder as any).erpnextOrderNumber}
                  />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-sp-text-muted">Customer</p>
                  <p className="font-medium text-sp-text-strong">{selectedOrder.customerDetails.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-sp-text-muted">Created</p>
                  <p className="font-medium text-sp-text-strong">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-sp-text-muted">Delivery Date</p>
                  <p className="font-medium text-sp-text-strong">
                    {selectedOrder.expectedDelivery ? formatDate(selectedOrder.expectedDelivery) : 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-sp-text-muted">Total Value</p>
                  <p className="font-medium text-sp-text-strong">{formatCurrency(selectedOrder.financials.totalAmount)}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link href={`/orders/${selectedOrder.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </Link>
                {selectedOrder.status === 'STAGED' && !shipment && (
                  <Button
                    size="sm"
                    onClick={handleCreateLoad}
                    disabled={creatingLoad}
                  >
                    {creatingLoad ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4 mr-2" />
                    )}
                    Create Load
                  </Button>
                )}
                {shipment && (
                  <>
                    <Button size="sm" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Track Shipment
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadBOL(shipment.id)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download BOL
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPackingSlip(shipment.id)}>
                      <Package className="h-4 w-4 mr-2" />
                      Packing Slip
                    </Button>
                  </>
                )}
                {/* Pick Ticket available for orders that are at least ALLOCATED */}
                {['ALLOCATED', 'PLANNED', 'STAGED', 'LOAD_PLANNED'].includes(selectedOrder.status) && (
                  <Button size="sm" variant="outline" onClick={() => handleDownloadPickTicket(selectedOrder.id)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Pick Ticket
                  </Button>
                )}

              </div>
            </CardContent>
          </Card>
        )
      })()}
    </div >
  )
}

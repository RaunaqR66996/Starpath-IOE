"use client"

import React, { useState } from 'react'
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
  CheckCircle
} from 'lucide-react'

export function TMSOrders() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  const orders = [
    {
      id: 'ORD-001',
      customer: 'Acme Corp',
      origin: 'Dallas, TX',
      destination: 'New York, NY',
      status: 'pending',
      priority: 'high',
      value: '$2,450',
      weight: '1,250 lbs',
      created: '2024-01-15',
      deliveryDate: '2024-01-18',
      carrier: null
    },
    {
      id: 'ORD-002',
      customer: 'Tech Solutions',
      origin: 'Phoenix, AZ',
      destination: 'Chicago, IL',
      status: 'in_transit',
      priority: 'medium',
      value: '$1,890',
      weight: '890 lbs',
      created: '2024-01-14',
      deliveryDate: '2024-01-17',
      carrier: 'FedEx Ground'
    },
    {
      id: 'ORD-003',
      customer: 'Global Industries',
      origin: 'Columbus, OH',
      destination: 'Los Angeles, CA',
      status: 'delivered',
      priority: 'low',
      value: '$3,200',
      weight: '2,100 lbs',
      created: '2024-01-12',
      deliveryDate: '2024-01-16',
      carrier: 'UPS Ground'
    },
    {
      id: 'ORD-004',
      customer: 'Manufacturing Co',
      origin: 'Houston, TX',
      destination: 'Seattle, WA',
      status: 'exception',
      priority: 'high',
      value: '$4,100',
      weight: '3,200 lbs',
      created: '2024-01-13',
      deliveryDate: '2024-01-19',
      carrier: 'DHL Express'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_transit': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'exception': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <Button variant="outline" size="sm">
              <Truck className="h-4 w-4 mr-2" />
              Create Shipment ({selectedOrders.length})
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
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-2 font-medium text-blue-600">{order.id}</td>
                    <td className="p-2">{order.customer}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span>{order.origin}</span>
                        <span>→</span>
                        <span>{order.destination}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </td>
                    <td className="p-2 font-medium">{order.value}</td>
                    <td className="p-2">{order.weight}</td>
                    <td className="p-2">
                      {order.carrier ? (
                        <span className="text-sm">{order.carrier}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Truck className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Clock className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Panel */}
      {selectedOrders.length === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Details - {selectedOrders[0]}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">Acme Corp</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">Jan 15, 2024</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Date</p>
                <p className="font-medium">Jan 18, 2024</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="font-medium">$2,450</p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Credit Check
              </Button>
              <Button size="sm" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Get Quotes
              </Button>
              <Button size="sm" variant="outline">
                <Truck className="h-4 w-4 mr-2" />
                Create Shipment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, CheckCircle2, X } from "lucide-react"

interface Order {
  id: string
  orderNumber: string
  customer: string
  destination: string
  weight: number
  value: number
}

const mockOrders: Order[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function OrderConsolidation() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [consolidationResult, setConsolidationResult] = useState<any>(null)

  const toggleOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleConsolidate = () => {
    // TODO: Integrate with consolidation API
    setConsolidationResult({
      consolidatedShipment: 'SHIP-CONS-001',
      totalWeight: selectedOrders.reduce((sum, id) => {
        const order = mockOrders.find(o => o.id === id)
        return sum + (order?.weight || 0)
      }, 0),
      totalValue: selectedOrders.reduce((sum, id) => {
        const order = mockOrders.find(o => o.id === id)
        return sum + (order?.value || 0)
      }, 0),
      estimatedSavings: 125.50
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Consolidation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Select multiple orders to consolidate into a single shipment for cost savings.
        </div>

        <div className="space-y-2">
          {mockOrders.map((order) => (
            <div
              key={order.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedOrders.includes(order.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => toggleOrder(order.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleOrder(order.id)}
                    className="rounded"
                  />
                  <Package className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{order.orderNumber}</div>
                    <div className="text-sm text-gray-600">{order.customer} • {order.destination}</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>{order.weight} kg</div>
                  <div className="text-gray-500">${order.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedOrders.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Selected Orders: {selectedOrders.length}</span>
              <Button size="sm" onClick={handleConsolidate}>
                Consolidate
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Total Weight: {selectedOrders.reduce((sum, id) => {
                const order = mockOrders.find(o => o.id === id)
                return sum + (order?.weight || 0)
              }, 0)} kg
            </div>
          </div>
        )}

        {consolidationResult && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium">Consolidation Successful</span>
            </div>
            <div className="text-sm space-y-1">
              <div>Consolidated Shipment: <Badge>{consolidationResult.consolidatedShipment}</Badge></div>
              <div>Estimated Savings: <span className="font-medium text-green-600">${consolidationResult.estimatedSavings}</span></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

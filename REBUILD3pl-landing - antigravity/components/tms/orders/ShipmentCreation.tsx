"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, Package, CheckCircle2 } from "lucide-react"

interface Order {
  id: string
  orderNumber: string
  customer: string
  destination: string
  weight: number
}

const mockOrders: Order[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ShipmentCreation() {
  const [selectedOrder, setSelectedOrder] = useState<string>('')
  const [carrier, setCarrier] = useState<string>('')
  const [serviceLevel, setServiceLevel] = useState<string>('')
  const [created, setCreated] = useState(false)

  const handleCreateShipment = () => {
    // TODO: Integrate with shipment creation API
    setCreated(true)
    setTimeout(() => setCreated(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Shipment from Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Order</label>
          <Select value={selectedOrder} onValueChange={setSelectedOrder}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an order" />
            </SelectTrigger>
            <SelectContent>
              {mockOrders.map((order) => (
                <SelectItem key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customer} ({order.destination})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedOrder && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Carrier</label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fedex">FedEx Ground</SelectItem>
                  <SelectItem value="ups">UPS Ground</SelectItem>
                  <SelectItem value="dhl">DHL Express</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Service Level</label>
              <Select value={serviceLevel} onValueChange={setServiceLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ground">Ground</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="overnight">Overnight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedOrder && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Order Details</span>
                </div>
                <div className="text-sm space-y-1">
                  {(() => {
                    const order = mockOrders.find(o => o.id === selectedOrder)
                    return order ? (
                      <>
                        <div>Order: {order.orderNumber}</div>
                        <div>Customer: {order.customer}</div>
                        <div>Destination: {order.destination}</div>
                        <div>Weight: {order.weight} kg</div>
                      </>
                    ) : null
                  })()}
                </div>
              </div>
            )}

            {created && (
              <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Shipment created successfully!</span>
              </div>
            )}

            <Button
              onClick={handleCreateShipment}
              disabled={!carrier || !serviceLevel || created}
              className="w-full"
            >
              <Truck className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

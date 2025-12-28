"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, X, Save } from "lucide-react"

interface Order {
  id: string
  orderNumber: string
  customer: string
  status: string
  priority: string
}

const mockOrder: Order    = {} // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function OrderModification() {
  const [order] = useState<Order>(mockOrder)
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(order.status)
  const [priority, setPriority] = useState(order.priority)
  const [cancelled, setCancelled] = useState(false)

  const handleSave = () => {
    // TODO: Integrate with order update API
    setEditing(false)
  }

  const handleCancel = () => {
    // TODO: Integrate with order cancellation API
    setCancelled(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Modification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium">{order.orderNumber}</div>
              <div className="text-sm text-gray-600">{order.customer}</div>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="tendered">Tendered</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="rush">Rush</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge>{status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priority:</span>
                <Badge>{priority}</Badge>
              </div>
            </div>
          )}
        </div>

        {!cancelled && (
          <Button variant="destructive" onClick={handleCancel} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
        )}

        {cancelled && (
          <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800">
            Order has been cancelled
          </div>
        )}
      </CardContent>
    </Card>
  )
}

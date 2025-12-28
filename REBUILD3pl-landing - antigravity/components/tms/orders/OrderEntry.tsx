"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Save, Loader2 } from "lucide-react"
import { createOrder } from "@/app/actions/orders"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function OrderEntry() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerName: '',
    customerEmail: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    priority: 'normal',
    expectedDelivery: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createOrder(formData)

      if (result.success) {
        toast.success("Order created successfully")
        // Reset form or redirect
        setFormData({
          orderNumber: '',
          customerName: '',
          customerEmail: '',
          shippingAddress: '',
          shippingCity: '',
          shippingState: '',
          shippingZip: '',
          priority: 'normal',
          expectedDelivery: ''
        })
        // Optional: Redirect to list view
        router.push('/tms3/orders')
      } else {
        toast.error("Failed to create order")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Order Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="customerEmail">Customer Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="shippingAddress">Shipping Address</Label>
            <Input
              id="shippingAddress"
              value={formData.shippingAddress}
              onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="shippingCity">City</Label>
              <Input
                id="shippingCity"
                value={formData.shippingCity}
                onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingState">State</Label>
              <Input
                id="shippingState"
                value={formData.shippingState}
                onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="shippingZip">ZIP Code</Label>
              <Input
                id="shippingZip"
                value={formData.shippingZip}
                onChange={(e) => setFormData({ ...formData, shippingZip: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="rush">Rush</option>
              </select>
            </div>
            <div>
              <Label htmlFor="expectedDelivery">Expected Delivery Date</Label>
              <Input
                id="expectedDelivery"
                type="date"
                value={formData.expectedDelivery}
                onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Package } from "lucide-react"

interface LoadItem {
  id: string
  description: string
  quantity: number
  weight: number
  dimensions: string
}

export function LoadBuilder() {
  const [items, setItems] = useState<LoadItem[]>([])
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    weight: 0,
    dimensions: ''
  })

  const addItem = () => {
    if (newItem.description) {
      setItems([...items, { ...newItem, id: Date.now().toString() }])
      setNewItem({ description: '', quantity: 1, weight: 0, dimensions: '' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Load Building</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Description</Label>
            <Input
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Item description"
            />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              value={newItem.weight}
              onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Dimensions (LxWxH)</Label>
            <Input
              value={newItem.dimensions}
              onChange={(e) => setNewItem({ ...newItem, dimensions: e.target.value })}
              placeholder="e.g., 48x40x36"
            />
          </div>
        </div>
        <Button onClick={addItem} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>

        {items.length > 0 && (
          <div className="border rounded-lg p-3 space-y-2">
            <div className="font-medium mb-2">Load Items ({items.length})</div>
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{item.description}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Qty: {item.quantity} • {item.weight} kg
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

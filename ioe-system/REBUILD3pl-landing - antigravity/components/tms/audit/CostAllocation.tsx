"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, DollarSign } from "lucide-react"

interface Allocation {
  id: string
  invoiceNumber: string
  costCenter: string
  department: string
  amount: number
  percentage: number
}

const mockAllocations: Allocation[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CostAllocation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Center Allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockAllocations.map((allocation) => (
          <div key={allocation.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{allocation.costCenter}</span>
              </div>
              <Badge variant="outline">{allocation.percentage}%</Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">Department: {allocation.department}</div>
              <div className="flex justify-between">
                <span>Allocated Amount:</span>
                <span className="font-medium">${allocation.amount.toFixed(2)}</span>
              </div>
              <div className="text-gray-500">Invoice: {allocation.invoiceNumber}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


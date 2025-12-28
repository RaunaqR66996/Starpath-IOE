"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"

interface SpendData {
  category: string
  amount: number
  percentage: number
  trend: 'up' | 'down'
  change: number
}

const mockSpend: SpendData[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function FreightSpendAnalysis() {
  const totalSpend = mockSpend.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Freight Spend Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Total Spend</div>
          <div className="text-3xl font-bold">${totalSpend.toLocaleString()}</div>
        </div>

        {mockSpend.map((item, index) => (
          <div key={index} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{item.category}</span>
              <div className="flex items-center gap-1">
                {item.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${item.trend === 'down' ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change > 0 ? '+' : ''}{item.change}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium">${item.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Percentage</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


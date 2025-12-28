"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CheckCircle2, Clock } from "lucide-react"

interface Payment {
  id: string
  invoiceNumber: string
  carrier: string
  amount: number
  dueDate: string
  status: string
}

const mockPayments: Payment[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function PaymentProcessing() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockPayments.map((payment) => (
          <div key={payment.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{payment.invoiceNumber}</span>
              </div>
              {payment.status === 'approved' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">{payment.carrier}</div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">${payment.amount.toFixed(2)}</span>
              </div>
              <div className="text-gray-500">Due: {payment.dueDate}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


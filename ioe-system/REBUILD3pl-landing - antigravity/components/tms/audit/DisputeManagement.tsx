"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MessageSquare, CheckCircle2 } from "lucide-react"

interface Dispute {
  id: string
  invoiceNumber: string
  carrier: string
  amount: number
  reason: string
  status: string
  createdDate: string
}

const mockDisputes: Dispute[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function DisputeManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockDisputes.map((dispute) => (
          <div key={dispute.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">{dispute.invoiceNumber}</span>
              </div>
              <Badge className={dispute.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {dispute.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">{dispute.carrier}</div>
              <div className="flex justify-between">
                <span>Disputed Amount:</span>
                <span className="font-medium text-red-600">${dispute.amount.toFixed(2)}</span>
              </div>
              <div className="text-gray-600">Reason: {dispute.reason}</div>
              <div className="text-gray-500">Created: {dispute.createdDate}</div>
            </div>
            {dispute.status === 'open' && (
              <Button variant="outline" size="sm" className="w-full mt-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Carrier
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

interface Tender {
  id: string
  shipmentId: string
  carrier: string
  status: string
  sentAt: string
  respondedAt?: string
}

const mockTenders: Tender[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function Tendering() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated Tendering</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockTenders.map((tender) => (
          <div key={tender.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(tender.status)}
                <span className="font-medium">{tender.shipmentId}</span>
              </div>
              <Badge className={getStatusColor(tender.status)}>
                {tender.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">{tender.carrier}</div>
              <div className="text-gray-500">
                Sent: {tender.sentAt}
                {tender.respondedAt && ` • Responded: ${tender.respondedAt}`}
              </div>
            </div>
          </div>
        ))}

        <Button className="w-full">
          Create New Tender
        </Button>
      </CardContent>
    </Card>
  )
}


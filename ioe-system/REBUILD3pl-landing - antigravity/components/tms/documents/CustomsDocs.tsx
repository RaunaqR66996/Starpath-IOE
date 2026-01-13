"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Globe } from "lucide-react"

interface CustomsDoc {
  id: string
  type: string
  shipmentId: string
  status: string
  country: string
}

const mockCustomsDocs: CustomsDoc[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CustomsDocs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customs Documentation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockCustomsDocs.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">{doc.type}</span>
              </div>
              <Badge className={doc.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {doc.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">Shipment: {doc.shipmentId}</div>
              <div className="text-gray-600">Country: {doc.country}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle2, Clock, XCircle } from "lucide-react"

interface EDIDocument {
  id: string
  type: string
  transactionSet: string
  status: string
  processedAt: string
  shipmentId: string
}

const mockEDIDocs: EDIDocument[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function EDIDocuments() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EDI Document Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockEDIDocs.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(doc.status)}
                <span className="font-medium text-sm">{doc.type}</span>
                <Badge variant="outline" className="text-xs">
                  {doc.transactionSet}
                </Badge>
              </div>
              <Badge className={getStatusColor(doc.status)}>
                {doc.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">Shipment: {doc.shipmentId}</div>
              <div className="text-gray-500">Processed: {doc.processedAt}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


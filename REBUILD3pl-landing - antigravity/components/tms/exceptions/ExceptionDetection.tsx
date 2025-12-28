"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell } from "lucide-react"

interface Exception {
  id: string
  type: string
  severity: string
  shipmentId: string
  description: string
  detectedAt: string
}

const mockExceptions: Exception[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ExceptionDetection() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Auto-Detected Exceptions</span>
          <Badge variant="outline">{mockExceptions.length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockExceptions.map((exception) => (
          <div key={exception.id} className="border rounded-lg p-3 border-red-200 bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-red-600" />
                <span className="font-medium text-sm">{exception.shipmentId}</span>
              </div>
              <Badge className={getSeverityColor(exception.severity)}>
                {exception.severity}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-700">{exception.description}</div>
              <div className="text-gray-500">Type: {exception.type.replace('_', ' ')}</div>
              <div className="text-gray-500">Detected: {exception.detectedAt}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


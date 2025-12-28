"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell } from "lucide-react"

interface Alert {
  id: string
  type: string
  severity: string
  message: string
  timestamp: string
  acknowledged: boolean
}

const mockAlerts: Alert[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ExceptionAlerts() {
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
          <span>Exception Alerts</span>
          <Badge variant="outline">{mockAlerts.filter(a => !a.acknowledged).length} unread</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-3 ${
              !alert.acknowledged ? 'border-red-200 bg-red-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-sm">{alert.message}</span>
              </div>
              <Badge className={getSeverityColor(alert.severity)}>
                {alert.severity}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{alert.type.replace('_', ' ')}</span>
              <span>{alert.timestamp}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


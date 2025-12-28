"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plug, CheckCircle2, XCircle } from "lucide-react"

interface Integration {
  id: string
  name: string
  type: string
  status: string
  lastSync: string
}

const mockIntegrations: Integration[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function IntegrationSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockIntegrations.map((integration) => (
          <div key={integration.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Plug className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{integration.name}</span>
                <Badge variant="outline" className="text-xs">{integration.type}</Badge>
              </div>
              {integration.status === 'connected' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={integration.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {integration.status}
                </Badge>
              </div>
              <div className="text-gray-500">Last Sync: {integration.lastSync}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


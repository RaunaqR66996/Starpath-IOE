"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Settings } from "lucide-react"

interface Preference {
  id: string
  rule: string
  carrier: string
  priority: number
  enabled: boolean
}

const mockPreferences: Preference[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CarrierPreferences() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrier Routing Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockPreferences.map((pref) => (
          <div key={pref.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">{pref.rule}</span>
              </div>
              <Badge className={pref.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {pref.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-1 text-gray-600">
                <Truck className="h-3 w-3" />
                <span>Carrier: {pref.carrier}</span>
              </div>
              <div className="text-gray-500">Priority: {pref.priority}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


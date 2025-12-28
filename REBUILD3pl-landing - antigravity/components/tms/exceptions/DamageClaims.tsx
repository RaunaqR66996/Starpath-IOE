"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, FileText } from "lucide-react"

interface Claim {
  id: string
  shipmentId: string
  damageType: string
  estimatedValue: number
  status: string
  filedDate: string
}

const mockClaims: Claim[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function DamageClaims() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Damage & Claims Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockClaims.map((claim) => (
          <div key={claim.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium">{claim.shipmentId}</span>
              </div>
              <Badge className={
                claim.status === 'open' ? 'bg-red-100 text-red-800' :
                claim.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }>
                {claim.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">Type: {claim.damageType}</div>
              <div className="flex justify-between">
                <span>Estimated Value:</span>
                <span className="font-medium">${claim.estimatedValue.toFixed(2)}</span>
              </div>
              <div className="text-gray-500">Filed: {claim.filedDate}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


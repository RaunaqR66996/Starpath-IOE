"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, User } from "lucide-react"

interface Resolution {
  id: string
  exceptionId: string
  resolution: string
  resolvedBy: string
  resolvedAt: string
  status: string
}

const mockResolutions: Resolution[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ResolutionTracking() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolution Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockResolutions.map((resolution) => (
          <div key={resolution.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {resolution.status === 'resolved' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
                <span className="font-medium">{resolution.exceptionId}</span>
              </div>
              <Badge className={resolution.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {resolution.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-700">{resolution.resolution}</div>
              <div className="flex items-center gap-2 text-gray-500">
                <User className="h-3 w-3" />
                <span>{resolution.resolvedBy} • {resolution.resolvedAt}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


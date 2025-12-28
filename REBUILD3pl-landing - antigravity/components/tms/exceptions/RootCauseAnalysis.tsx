"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertTriangle } from "lucide-react"

interface RootCause {
  id: string
  exceptionType: string
  rootCause: string
  frequency: number
  impact: string
  recommendation: string
}

const mockRootCauses: RootCause[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function RootCauseAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Root Cause Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockRootCauses.map((cause) => (
          <div key={cause.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{cause.exceptionType}</span>
              </div>
              <Badge className={cause.impact === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                {cause.impact} impact
              </Badge>
            </div>
            <div className="text-sm space-y-2">
              <div>
                <div className="text-gray-600">Root Cause:</div>
                <div className="font-medium">{cause.rootCause}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frequency:</span>
                <span className="font-medium">{cause.frequency} occurrences</span>
              </div>
              <div className="bg-yellow-50 p-2 rounded flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <div className="font-medium">Recommendation:</div>
                  <div>{cause.recommendation}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


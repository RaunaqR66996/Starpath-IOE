"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, FileText } from "lucide-react"

interface AuditResult {
  id: string
  rateId: string
  carrier: string
  status: string
  discrepancy: number
  issue: string
}

const mockAudits: AuditResult[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function RateAudit() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Validation & Audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockAudits.map((audit) => (
          <div key={audit.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{audit.rateId}</span>
              </div>
              {audit.status === 'valid' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">{audit.carrier}</div>
              {audit.discrepancy > 0 && (
                <div className="text-yellow-800 bg-yellow-50 p-2 rounded">
                  Discrepancy: ${audit.discrepancy.toFixed(2)} - {audit.issue}
                </div>
              )}
              {audit.discrepancy === 0 && (
                <div className="text-green-800 bg-green-50 p-2 rounded">
                  {audit.issue}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


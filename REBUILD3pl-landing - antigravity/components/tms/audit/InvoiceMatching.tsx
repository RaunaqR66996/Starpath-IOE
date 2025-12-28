"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, FileText } from "lucide-react"

interface MatchResult {
  id: string
  invoiceNumber: string
  carrier: string
  invoiceAmount: number
  expectedAmount: number
  difference: number
  status: string
}

const mockMatches: MatchResult[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function InvoiceMatching() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Matching</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockMatches.map((match) => (
          <div key={match.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{match.invoiceNumber}</span>
              </div>
              {match.status === 'matched' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">{match.carrier}</div>
              <div className="flex justify-between">
                <span>Invoice Amount:</span>
                <span className="font-medium">${match.invoiceAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Amount:</span>
                <span className="font-medium">${match.expectedAmount.toFixed(2)}</span>
              </div>
              {match.difference !== 0 && (
                <div className={`flex justify-between ${
                  match.difference > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  <span>Difference:</span>
                  <span className="font-medium">
                    {match.difference > 0 ? '+' : ''}${match.difference.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


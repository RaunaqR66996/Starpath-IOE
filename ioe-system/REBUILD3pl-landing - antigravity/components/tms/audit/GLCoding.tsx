"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Hash } from "lucide-react"

interface GLEntry {
  id: string
  invoiceNumber: string
  glAccount: string
  description: string
  amount: number
}

const mockGLEntries: GLEntry[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function GLCoding() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Ledger Coding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockGLEntries.map((entry) => (
          <div key={entry.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{entry.glAccount}</span>
              </div>
              <Badge variant="outline">{entry.invoiceNumber}</Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">{entry.description}</div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">${entry.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


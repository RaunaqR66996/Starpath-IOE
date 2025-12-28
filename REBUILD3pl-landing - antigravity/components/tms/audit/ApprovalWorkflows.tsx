"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, CheckCircle2, Clock } from "lucide-react"

interface Approval {
  id: string
  invoiceNumber: string
  amount: number
  currentApprover: string
  status: string
  level: number
  totalLevels: number
}

const mockApprovals: Approval[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ApprovalWorkflows() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Approval Workflows</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockApprovals.map((approval) => (
          <div key={approval.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {approval.status === 'approved' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
                <span className="font-medium">{approval.invoiceNumber}</span>
              </div>
              <Badge className={approval.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {approval.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">${approval.amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <User className="h-3 w-3" />
                <span>Current Approver: {approval.currentApprover}</span>
              </div>
              <div className="text-gray-500">
                Approval Level: {approval.level} of {approval.totalLevels}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


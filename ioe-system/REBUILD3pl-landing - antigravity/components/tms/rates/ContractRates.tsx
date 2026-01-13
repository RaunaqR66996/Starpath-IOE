"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, DollarSign, Calendar } from "lucide-react"

interface ContractRate {
  id: string
  carrier: string
  contractNumber: string
  rateType: string
  baseRate: number
  effectiveDate: string
  expiryDate: string
  status: string
}

const mockContractRates: ContractRate[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ContractRates() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Rate Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockContractRates.map((rate) => (
          <div key={rate.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{rate.contractNumber}</span>
              </div>
              <Badge className={rate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {rate.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">{rate.carrier}</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Base Rate: ${rate.baseRate}/unit ({rate.rateType})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{rate.effectiveDate} - {rate.expiryDate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


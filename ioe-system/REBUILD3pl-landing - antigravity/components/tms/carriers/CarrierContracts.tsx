"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, DollarSign } from "lucide-react"

interface Contract {
  id: string
  carrierName: string
  contractNumber: string
  startDate: string
  endDate: string
  status: string
  rateType: string
}

const mockContracts: Contract[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CarrierContracts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrier Contracts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockContracts.map((contract) => (
          <div key={contract.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{contract.contractNumber}</span>
              </div>
              <Badge className={contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {contract.status}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>{contract.carrierName}</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{contract.startDate} - {contract.endDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{contract.rateType}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full">
          Add New Contract
        </Button>
      </CardContent>
    </Card>
  )
}


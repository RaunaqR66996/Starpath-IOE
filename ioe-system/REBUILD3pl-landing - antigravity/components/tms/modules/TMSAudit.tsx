"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Receipt, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText
} from 'lucide-react'

export function TMSAudit() {
  const auditItems = [
    {
      id: 'AUD001',
      invoiceNumber: 'INV-2024-001',
      carrier: 'FedEx Ground',
      amount: 245.50,
      status: 'approved',
      discrepancy: 0,
      date: '2024-01-15'
    },
    {
      id: 'AUD002',
      invoiceNumber: 'INV-2024-002',
      carrier: 'UPS Ground',
      amount: 238.75,
      status: 'pending',
      discrepancy: 12.50,
      date: '2024-01-14'
    },
    {
      id: 'AUD003',
      invoiceNumber: 'INV-2024-003',
      carrier: 'DHL Express',
      amount: 445.00,
      status: 'rejected',
      discrepancy: -25.00,
      date: '2024-01-13'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Freight Audit & Billing</h2>
        <p className="text-sm text-gray-600">Audit freight bills and manage billing</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">127</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">$45,230</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Discrepancies</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Savings</p>
                <p className="text-2xl font-bold">$2,340</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{item.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">{item.carrier} • {item.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${item.amount}</p>
                    {item.discrepancy !== 0 && (
                      <p className={`text-sm ${item.discrepancy > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {item.discrepancy > 0 ? '+' : ''}${item.discrepancy}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






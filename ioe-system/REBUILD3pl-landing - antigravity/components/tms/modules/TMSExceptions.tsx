"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

export function TMSExceptions() {
  const exceptions = [
    {
      id: 'EXC001',
      type: 'delay',
      severity: 'high',
      title: 'Shipment Delay - SH003',
      description: 'Shipment running 4 hours behind schedule due to weather',
      status: 'open',
      created: '2024-01-17 10:30',
      assignedTo: 'John Smith'
    },
    {
      id: 'EXC002',
      type: 'damage',
      severity: 'medium',
      title: 'Package Damage - SH001',
      description: 'Package arrived with visible damage to corner',
      status: 'in_progress',
      created: '2024-01-16 14:20',
      assignedTo: 'Sarah Johnson'
    },
    {
      id: 'EXC003',
      type: 'missing',
      severity: 'high',
      title: 'Missing Package - SH002',
      description: 'One package from shipment not delivered',
      status: 'resolved',
      created: '2024-01-15 09:15',
      assignedTo: 'Mike Davis'
    }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <XCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Exception Handling</h2>
        <p className="text-sm text-gray-600">Manage exceptions and alerts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Exceptions</p>
                <p className="text-2xl font-bold text-red-600">12</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">8</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">5</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Resolution</p>
                <p className="text-2xl font-bold text-blue-600">2.3h</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exceptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Exceptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exceptions.map((exception) => (
              <div key={exception.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(exception.status)}
                    <div>
                      <p className="font-medium">{exception.title}</p>
                      <p className="text-sm text-gray-500">{exception.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {exception.created} • Assigned to: {exception.assignedTo}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getSeverityColor(exception.severity)}>
                    {exception.severity}
                  </Badge>
                  <Badge className={getStatusColor(exception.status)}>
                    {exception.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

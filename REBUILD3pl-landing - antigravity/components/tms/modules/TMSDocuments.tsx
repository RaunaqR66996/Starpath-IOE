"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Upload, 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react'

export function TMSDocuments() {
  const [searchTerm, setSearchTerm] = useState('')

  const documents = [
    {
      id: 'DOC001',
      type: 'BOL',
      title: 'Bill of Lading - SH001',
      status: 'generated',
      created: '2024-01-15',
      size: '245 KB',
      shipmentId: 'SH001'
    },
    {
      id: 'DOC002',
      type: 'Packing List',
      title: 'Packing List - ORD-001',
      status: 'pending',
      created: '2024-01-15',
      size: '128 KB',
      shipmentId: 'SH001'
    },
    {
      id: 'DOC003',
      type: 'Customs Form',
      title: 'Customs Declaration - SH002',
      status: 'approved',
      created: '2024-01-14',
      size: '312 KB',
      shipmentId: 'SH002'
    },
    {
      id: 'DOC004',
      type: 'Label',
      title: 'Shipping Label - SH003',
      status: 'printed',
      created: '2024-01-13',
      size: '89 KB',
      shipmentId: 'SH003'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'printed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BOL': return '📋'
      case 'Packing List': return '📦'
      case 'Customs Form': return '📄'
      case 'Label': return '🏷️'
      default: return '📄'
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Document Center</h2>
          <p className="text-sm text-gray-600">Manage BOLs, packing lists, customs forms, and labels</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      {/* Document Types */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="font-medium">Bill of Lading</p>
            <p className="text-sm text-gray-500">12 documents</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">📦</div>
            <p className="font-medium">Packing Lists</p>
            <p className="text-sm text-gray-500">8 documents</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">📄</div>
            <p className="font-medium">Customs Forms</p>
            <p className="text-sm text-gray-500">5 documents</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="text-3xl mb-2">🏷️</div>
            <p className="font-medium">Labels</p>
            <p className="text-sm text-gray-500">24 documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getTypeIcon(doc.type)}</div>
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-gray-500">{doc.type} • {doc.size} • {doc.created}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(doc.status)}>
                    {doc.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Bill of Lading</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Packing List</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Customs Form</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Shipping Label</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






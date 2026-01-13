"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { DocTypeList, TableColumn, FilterConfig } from '@/components/workspace/DocTypeList'
import { DocTypeForm, FormFieldConfig, FormSection, ChildTableConfig } from '@/components/workspace/DocTypeForm'
import { wmsWorkspaceConfig } from '../workspace-config'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Eye, Edit } from 'lucide-react'

export default function ASNPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'list' | 'form'>('list')
  const [recordId, setRecordId] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const view = searchParams.get('view')
    const id = searchParams.get('id')
    
    if (view === 'new' || view === 'edit' || view === 'view') {
      setMode('form')
      if (id) {
        setRecordId(id)
        loadASNData(id)
      } else {
        setRecordId(null)
        setInitialData(null)
      }
    } else {
      setMode('list')
      setRecordId(null)
      setInitialData(null)
    }
  }, [searchParams])

  const loadASNData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/wms/receiving/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load ASN:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = [
    { key: 'asnNumber', label: 'ASN Number', type: 'text', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, badgeConfig: {
      getVariant: (v) => {
        const s = v?.toUpperCase() || ''
        if (['RECEIVED', 'COMPLETED'].includes(s)) return 'default'
        if (['IN_TRANSIT', 'PENDING'].includes(s)) return 'secondary'
        return 'outline'
      },
      getLabel: (v) => v || 'Unknown',
    }},
    { key: 'expectedDate', label: 'Expected Date', type: 'date' },
    { key: 'supplierName', label: 'Supplier', type: 'text' },
    { key: 'totalItems', label: 'Total Items', type: 'number' },
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'IN_TRANSIT', label: 'In Transit' },
        { value: 'RECEIVED', label: 'Received' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'asnNumber', label: 'ASN Number', type: 'text', required: true, section: 'Details' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'IN_TRANSIT', label: 'In Transit' },
      { value: 'RECEIVED', label: 'Received' },
      { value: 'COMPLETED', label: 'Completed' },
    ], section: 'Details' },
    { name: 'expectedDate', label: 'Expected Date', type: 'date', section: 'Details' },
    { name: 'supplierName', label: 'Supplier Name', type: 'text', section: 'Supplier' },
    { name: 'supplierId', label: 'Supplier ID', type: 'text', section: 'Supplier' },
  ]

  const itemsTable: ChildTableConfig = {
    name: 'items',
    label: 'Expected Items',
    columns: [
      { name: 'sku', label: 'SKU', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'expectedQuantity', label: 'Expected Qty', type: 'number' },
      { name: 'receivedQuantity', label: 'Received Qty', type: 'number' },
    ],
    addRowLabel: 'Add Item',
  }

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['asnNumber', 'status', 'expectedDate'] },
    { label: 'Supplier', fields: ['supplierName', 'supplierId'] },
  ]

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId ? `/api/wms/receiving/${recordId}` : '/api/wms/receiving'
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save ASN')
      router.push('/wms/asn')
    } catch (error) {
      console.error('Error saving ASN:', error)
      throw error
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <WorkspaceSidebar config={wmsWorkspaceConfig} />
      <WorkspaceContent workspaceName="wms" workspaceTitle="Warehouse Management" className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-6">
          {mode === 'list' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Advanced Shipping Notices</h1>
                <Button onClick={() => router.push('/wms/asn?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New ASN
                </Button>
              </div>
              <DocTypeList
                doctype="ASN"
                columns={columns}
                apiEndpoint="/api/wms/receiving"
                filters={filters}
                onRowClick={(row) => router.push(`/wms/asn?view=edit&id=${row.id}`)}
                createRoute="/wms/asn?view=new"
                detailRoute={(id) => `/wms/asn?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/wms/asn?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/wms/asn?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/wms/asn')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} ASN
              </h1>
              <DocTypeForm
                doctype="ASN"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                childTables={[itemsTable]}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/wms/asn')}
                initialData={initialData}
                isLoading={loading}
              />
            </>
          )}
        </div>
      </WorkspaceContent>
    </div>
  )
}


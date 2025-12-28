"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { DocTypeList, TableColumn, FilterConfig } from '@/components/workspace/DocTypeList'
import { DocTypeForm, FormFieldConfig, FormSection, ChildTableConfig } from '@/components/workspace/DocTypeForm'
import { wmsWorkspaceConfig } from '../workspace-config'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Eye, Edit, Scan } from 'lucide-react'

export default function ReceivingPage() {
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
        loadReceivingData(id)
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

  const loadReceivingData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/wms/receiving/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load receiving:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (barcode: string) => {
    if (!recordId) return
    try {
      const response = await fetch(`/api/wms/receiving/${recordId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      })
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Scan failed:', error)
    }
  }

  const handleConfirm = async () => {
    if (!recordId) return
    try {
      const response = await fetch(`/api/wms/receiving/${recordId}/confirm`, {
        method: 'POST',
      })
      if (response.ok) {
        router.push('/wms/receiving')
      }
    } catch (error) {
      console.error('Confirm failed:', error)
    }
  }

  const columns: TableColumn[] = [
    { key: 'receiptNumber', label: 'Receipt Number', type: 'text', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, badgeConfig: {
      getVariant: (v) => {
        const s = v?.toUpperCase() || ''
        if (['COMPLETED'].includes(s)) return 'default'
        if (['IN_PROGRESS'].includes(s)) return 'secondary'
        return 'outline'
      },
      getLabel: (v) => v || 'Unknown',
    }},
    { key: 'asnNumber', label: 'ASN', type: 'text' },
    { key: 'receivedDate', label: 'Received Date', type: 'date' },
    { key: 'totalItems', label: 'Total Items', type: 'number' },
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'receiptNumber', label: 'Receipt Number', type: 'text', required: true, section: 'Details' },
    { name: 'asnNumber', label: 'ASN Number', type: 'text', section: 'Details' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'COMPLETED', label: 'Completed' },
    ], section: 'Details' },
  ]

  const itemsTable: ChildTableConfig = {
    name: 'items',
    label: 'Received Items',
    columns: [
      { name: 'sku', label: 'SKU', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'expectedQuantity', label: 'Expected', type: 'number' },
      { name: 'receivedQuantity', label: 'Received', type: 'number' },
      { name: 'qcStatus', label: 'QC Status', type: 'select', options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'PASSED', label: 'Passed' },
        { value: 'FAILED', label: 'Failed' },
      ]},
    ],
    addRowLabel: 'Add Item',
  }

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['receiptNumber', 'asnNumber', 'status'] },
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

      if (!response.ok) throw new Error('Failed to save receiving')
      router.push('/wms/receiving')
    } catch (error) {
      console.error('Error saving receiving:', error)
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
                <h1 className="text-2xl font-bold text-gray-900">Receiving</h1>
                <Button onClick={() => router.push('/wms/receiving?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Receipt
                </Button>
              </div>
              <DocTypeList
                doctype="Receiving"
                columns={columns}
                apiEndpoint="/api/wms/receiving"
                filters={filters}
                onRowClick={(row) => router.push(`/wms/receiving?view=edit&id=${row.id}`)}
                createRoute="/wms/receiving?view=new"
                detailRoute={(id) => `/wms/receiving?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/wms/receiving?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/wms/receiving?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/wms/receiving')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} Receiving
              </h1>
              <DocTypeForm
                doctype="Receiving"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                childTables={[itemsTable]}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/wms/receiving')}
                initialData={initialData}
                isLoading={loading}
                actions={recordId ? [{
                  label: 'Scan Barcode',
                  action: () => {
                    const barcode = prompt('Enter barcode:')
                    if (barcode) handleScan(barcode)
                  },
                  variant: 'outline',
                }, {
                  label: 'Confirm Receipt',
                  action: handleConfirm,
                  variant: 'default',
                }] : []}
              />
            </>
          )}
        </div>
      </WorkspaceContent>
    </div>
  )
}


"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { DocTypeList, TableColumn, FilterConfig } from '@/components/workspace/DocTypeList'
import { DocTypeForm, FormFieldConfig, FormSection } from '@/components/workspace/DocTypeForm'
import { wmsWorkspaceConfig } from '../workspace-config'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Eye, Edit } from 'lucide-react'

export default function InventoryPage() {
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
        loadInventoryData(id)
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

  const loadInventoryData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/wms/inventory/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = async (data: any) => {
    if (!recordId) return
    try {
      const response = await fetch(`/api/wms/inventory/${recordId}/adjust`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: data.quantity }),
      })
      if (response.ok) {
        router.push('/wms/inventory')
      }
    } catch (error) {
      console.error('Adjust failed:', error)
    }
  }

  const columns: TableColumn[] = [
    { key: 'sku', label: 'SKU', type: 'text', sortable: true },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'location', label: 'Location', type: 'text', sortable: true },
    { key: 'quantity', label: 'Quantity', type: 'number', sortable: true },
    { key: 'reservedQuantity', label: 'Reserved', type: 'number' },
    { key: 'availableQuantity', label: 'Available', type: 'number' },
    { key: 'status', label: 'Status', type: 'badge', badgeConfig: {
      getVariant: (v) => {
        const s = v?.toUpperCase() || ''
        if (['AVAILABLE'].includes(s)) return 'default'
        if (['RESERVED'].includes(s)) return 'secondary'
        return 'outline'
      },
      getLabel: (v) => v || 'Unknown',
    }},
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'AVAILABLE', label: 'Available' },
        { value: 'RESERVED', label: 'Reserved' },
        { value: 'ALLOCATED', label: 'Allocated' },
      ],
    },
    {
      key: 'sku',
      label: 'SKU',
      type: 'text',
      placeholder: 'Search by SKU',
    },
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'sku', label: 'SKU', type: 'text', required: true, section: 'Details' },
    { name: 'description', label: 'Description', type: 'text', section: 'Details' },
    { name: 'location', label: 'Location', type: 'text', section: 'Details' },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, section: 'Quantity' },
    { name: 'reservedQuantity', label: 'Reserved Quantity', type: 'number', section: 'Quantity' },
    { name: 'status', label: 'Status', type: 'select', options: [
      { value: 'AVAILABLE', label: 'Available' },
      { value: 'RESERVED', label: 'Reserved' },
      { value: 'ALLOCATED', label: 'Allocated' },
    ], section: 'Details' },
  ]

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['sku', 'description', 'location', 'status'] },
    { label: 'Quantity', fields: ['quantity', 'reservedQuantity'] },
  ]

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId ? `/api/wms/inventory/${recordId}` : '/api/wms/inventory'
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save inventory')
      router.push('/wms/inventory')
    } catch (error) {
      console.error('Error saving inventory:', error)
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
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <Button onClick={() => router.push('/wms/inventory?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Inventory Record
                </Button>
              </div>
              <DocTypeList
                doctype="Inventory"
                columns={columns}
                apiEndpoint="/api/wms/inventory"
                filters={filters}
                onRowClick={(row) => router.push(`/wms/inventory?view=edit&id=${row.id}`)}
                createRoute="/wms/inventory?view=new"
                detailRoute={(id) => `/wms/inventory?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/wms/inventory?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/wms/inventory?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/wms/inventory')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} Inventory
              </h1>
              <DocTypeForm
                doctype="Inventory"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/wms/inventory')}
                initialData={initialData}
                isLoading={loading}
                actions={recordId ? [{
                  label: 'Adjust Quantity',
                  action: handleAdjust,
                  variant: 'outline',
                }] : []}
              />
            </>
          )}
        </div>
      </WorkspaceContent>
    </div>
  )
}


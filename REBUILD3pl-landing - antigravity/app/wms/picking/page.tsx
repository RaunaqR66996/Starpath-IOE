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

export default function PickingPage() {
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
        loadPickingData(id)
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

  const loadPickingData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/wms/picking/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load picking:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = [
    { key: 'pickListNumber', label: 'Pick List Number', type: 'text', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, badgeConfig: {
      getVariant: (v) => {
        const s = v?.toUpperCase() || ''
        if (['COMPLETED'].includes(s)) return 'default'
        if (['IN_PROGRESS', 'ASSIGNED'].includes(s)) return 'secondary'
        return 'outline'
      },
      getLabel: (v) => v || 'Unknown',
    }},
    { key: 'orderNumber', label: 'Order Number', type: 'text' },
    { key: 'assignedTo', label: 'Assigned To', type: 'text' },
    { key: 'itemCount', label: 'Items', type: 'number' },
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'ASSIGNED', label: 'Assigned' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'pickListNumber', label: 'Pick List Number', type: 'text', required: true, section: 'Details' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'ASSIGNED', label: 'Assigned' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'COMPLETED', label: 'Completed' },
    ], section: 'Details' },
    { name: 'orderNumber', label: 'Order Number', type: 'text', section: 'Details' },
    { name: 'assignedTo', label: 'Assigned To', type: 'text', section: 'Details' },
  ]

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['pickListNumber', 'status', 'orderNumber', 'assignedTo'] },
  ]

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId ? `/api/wms/picking/${recordId}` : '/api/wms/picking'
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save picking')
      router.push('/wms/picking')
    } catch (error) {
      console.error('Error saving picking:', error)
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
                <h1 className="text-2xl font-bold text-gray-900">Picking</h1>
                <Button onClick={() => router.push('/wms/picking?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Pick List
                </Button>
              </div>
              <DocTypeList
                doctype="Picking"
                columns={columns}
                apiEndpoint="/api/wms/picking"
                filters={filters}
                onRowClick={(row) => router.push(`/wms/picking?view=edit&id=${row.id}`)}
                createRoute="/wms/picking?view=new"
                detailRoute={(id) => `/wms/picking?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/wms/picking?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/wms/picking?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/wms/picking')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} Picking
              </h1>
              <DocTypeForm
                doctype="Picking"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/wms/picking')}
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


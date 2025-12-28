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

export default function WavePage() {
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
        loadWaveData(id)
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

  const loadWaveData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/wms/waves/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load wave:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = [
    { key: 'waveNumber', label: 'Wave Number', type: 'text', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, badgeConfig: {
      getVariant: (v) => {
        const s = v?.toUpperCase() || ''
        if (['COMPLETED'].includes(s)) return 'default'
        if (['IN_PROGRESS', 'RELEASED'].includes(s)) return 'secondary'
        return 'outline'
      },
      getLabel: (v) => v || 'Unknown',
    }},
    { key: 'orderCount', label: 'Orders', type: 'number' },
    { key: 'createdDate', label: 'Created Date', type: 'date' },
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'RELEASED', label: 'Released' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'COMPLETED', label: 'Completed' },
      ],
    },
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'waveNumber', label: 'Wave Number', type: 'text', required: true, section: 'Details' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'RELEASED', label: 'Released' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'COMPLETED', label: 'Completed' },
    ], section: 'Details' },
    { name: 'createdDate', label: 'Created Date', type: 'date', section: 'Details' },
  ]

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['waveNumber', 'status', 'createdDate'] },
  ]

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId ? `/api/wms/waves/${recordId}` : '/api/wms/waves'
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save wave')
      router.push('/wms/wave')
    } catch (error) {
      console.error('Error saving wave:', error)
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
                <h1 className="text-2xl font-bold text-gray-900">Wave Planning</h1>
                <Button onClick={() => router.push('/wms/wave?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Wave
                </Button>
              </div>
              <DocTypeList
                doctype="Wave"
                columns={columns}
                apiEndpoint="/api/wms/waves"
                filters={filters}
                onRowClick={(row) => router.push(`/wms/wave?view=edit&id=${row.id}`)}
                createRoute="/wms/wave?view=new"
                detailRoute={(id) => `/wms/wave?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/wms/wave?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/wms/wave?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/wms/wave')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} Wave
              </h1>
              <DocTypeForm
                doctype="Wave"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/wms/wave')}
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


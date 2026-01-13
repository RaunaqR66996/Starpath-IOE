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

export default function QCPage() {
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
        loadQCData(id)
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

  const loadQCData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/wms/qc/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load QC:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = [
    { key: 'qcNumber', label: 'QC Number', type: 'text', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, badgeConfig: {
      getVariant: (v) => {
        const s = v?.toUpperCase() || ''
        if (['PASSED', 'COMPLETED'].includes(s)) return 'default'
        if (['IN_PROGRESS'].includes(s)) return 'secondary'
        if (['FAILED'].includes(s)) return 'destructive'
        return 'outline'
      },
      getLabel: (v) => v || 'Unknown',
    }},
    { key: 'receiptNumber', label: 'Receipt', type: 'text' },
    { key: 'qcDate', label: 'QC Date', type: 'date' },
    { key: 'inspectorName', label: 'Inspector', type: 'text' },
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'PASSED', label: 'Passed' },
        { value: 'FAILED', label: 'Failed' },
      ],
    },
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'qcNumber', label: 'QC Number', type: 'text', required: true, section: 'Details' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'PENDING', label: 'Pending' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'PASSED', label: 'Passed' },
      { value: 'FAILED', label: 'Failed' },
    ], section: 'Details' },
    { name: 'receiptNumber', label: 'Receipt Number', type: 'text', section: 'Details' },
    { name: 'qcDate', label: 'QC Date', type: 'date', section: 'Details' },
    { name: 'inspectorName', label: 'Inspector Name', type: 'text', section: 'Details' },
    { name: 'notes', label: 'Notes', type: 'textarea', section: 'Additional' },
  ]

  const itemsTable: ChildTableConfig = {
    name: 'items',
    label: 'QC Items',
    columns: [
      { name: 'sku', label: 'SKU', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'quantity', label: 'Quantity', type: 'number' },
      { name: 'qcResult', label: 'QC Result', type: 'select', options: [
        { value: 'PASS', label: 'Pass' },
        { value: 'FAIL', label: 'Fail' },
      ]},
      { name: 'defectReason', label: 'Defect Reason', type: 'text' },
    ],
    addRowLabel: 'Add Item',
  }

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['qcNumber', 'status', 'receiptNumber', 'qcDate', 'inspectorName'] },
    { label: 'Additional', fields: ['notes'] },
  ]

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId ? `/api/wms/qc/${recordId}` : '/api/wms/qc'
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save QC')
      router.push('/wms/qc')
    } catch (error) {
      console.error('Error saving QC:', error)
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
                <h1 className="text-2xl font-bold text-gray-900">Quality Control</h1>
                <Button onClick={() => router.push('/wms/qc?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New QC
                </Button>
              </div>
              <DocTypeList
                doctype="QC"
                columns={columns}
                apiEndpoint="/api/wms/qc"
                filters={filters}
                onRowClick={(row) => router.push(`/wms/qc?view=edit&id=${row.id}`)}
                createRoute="/wms/qc?view=new"
                detailRoute={(id) => `/wms/qc?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/wms/qc?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/wms/qc?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/wms/qc')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} QC
              </h1>
              <DocTypeForm
                doctype="QC"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                childTables={[itemsTable]}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/wms/qc')}
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


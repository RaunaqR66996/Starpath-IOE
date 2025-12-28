"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { DocTypeList, TableColumn } from '@/components/workspace/DocTypeList'
import { DocTypeForm, FormFieldConfig, FormSection, ChildTableConfig } from '@/components/workspace/DocTypeForm'
import { wmsWorkspaceConfig } from '../workspace-config'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Eye, Edit } from 'lucide-react'

export default function WarehousePage() {
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
        loadWarehouseData(id)
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

  const loadWarehouseData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/warehouse/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load warehouse:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = [
    { key: 'code', label: 'Code', type: 'text', sortable: true },
    { key: 'name', label: 'Name', type: 'text', sortable: true },
    { key: 'addressLine1', label: 'Address', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'isActive', label: 'Active', type: 'badge', badgeConfig: {
      getVariant: (v) => v ? 'default' : 'outline',
      getLabel: (v) => v ? 'Yes' : 'No',
    }},
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'code', label: 'Warehouse Code', type: 'text', required: true, section: 'Details' },
    { name: 'name', label: 'Warehouse Name', type: 'text', required: true, section: 'Details' },
    { name: 'isActive', label: 'Active', type: 'select', options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ], section: 'Details' },
    { name: 'addressLine1', label: 'Address Line 1', type: 'text', section: 'Address' },
    { name: 'addressLine2', label: 'Address Line 2', type: 'text', section: 'Address' },
    { name: 'city', label: 'City', type: 'text', section: 'Address' },
    { name: 'state', label: 'State', type: 'text', section: 'Address' },
    { name: 'zipCode', label: 'Zip Code', type: 'text', section: 'Address' },
    { name: 'country', label: 'Country', type: 'text', section: 'Address' },
  ]

  const zonesTable: ChildTableConfig = {
    name: 'zones',
    label: 'Zones',
    columns: [
      { name: 'zoneCode', label: 'Zone Code', type: 'text' },
      { name: 'zoneName', label: 'Zone Name', type: 'text' },
      { name: 'type', label: 'Type', type: 'select', options: [
        { value: 'STORAGE', label: 'Storage' },
        { value: 'PICKING', label: 'Picking' },
        { value: 'STAGING', label: 'Staging' },
      ]},
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
    ],
    addRowLabel: 'Add Zone',
  }

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['code', 'name', 'isActive'] },
    { label: 'Address', fields: ['addressLine1', 'addressLine2', 'city', 'state', 'zipCode', 'country'] },
  ]

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId ? `/api/warehouse/${recordId}` : '/api/warehouse'
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save warehouse')
      router.push('/wms/warehouse')
    } catch (error) {
      console.error('Error saving warehouse:', error)
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
                <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
                <Button onClick={() => router.push('/wms/warehouse?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Warehouse
                </Button>
              </div>
              <DocTypeList
                doctype="Warehouse"
                columns={columns}
                apiEndpoint="/api/warehouse"
                onRowClick={(row) => router.push(`/wms/warehouse?view=edit&id=${row.id}`)}
                createRoute="/wms/warehouse?view=new"
                detailRoute={(id) => `/wms/warehouse?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/wms/warehouse?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/wms/warehouse?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/wms/warehouse')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} Warehouse
              </h1>
              <DocTypeForm
                doctype="Warehouse"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                childTables={[zonesTable]}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/wms/warehouse')}
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


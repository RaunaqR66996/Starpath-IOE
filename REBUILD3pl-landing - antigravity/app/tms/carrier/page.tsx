"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { DocTypeList, TableColumn } from '@/components/workspace/DocTypeList'
import { DocTypeForm, FormFieldConfig, FormSection } from '@/components/workspace/DocTypeForm'
import { tmsWorkspaceConfig } from '../workspace-config'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Eye, Edit } from 'lucide-react'

export default function CarrierPage() {
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
        loadCarrierData(id)
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

  const loadCarrierData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tms/carriers/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load carrier:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = [
    { key: 'name', label: 'Name', type: 'text', sortable: true },
    { key: 'code', label: 'SCAC Code', type: 'text', sortable: true },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'isActive', label: 'Active', type: 'badge', badgeConfig: {
      getVariant: (v) => v ? 'default' : 'outline',
      getLabel: (v) => v ? 'Yes' : 'No',
    }},
    { key: 'contactName', label: 'Contact', type: 'text' },
    { key: 'contactPhone', label: 'Phone', type: 'text' },
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'name', label: 'Carrier Name', type: 'text', required: true, section: 'Details' },
    { name: 'code', label: 'SCAC Code', type: 'text', section: 'Details' },
    { name: 'type', label: 'Type', type: 'select', options: [
      { value: 'PARCEL', label: 'Parcel' },
      { value: 'LTL', label: 'LTL' },
      { value: 'FTL', label: 'FTL' },
      { value: 'INTERMODAL', label: 'Intermodal' },
    ], section: 'Details' },
    { name: 'isActive', label: 'Active', type: 'select', options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ], section: 'Details' },
    { name: 'contactName', label: 'Contact Name', type: 'text', section: 'Contact' },
    { name: 'contactPhone', label: 'Contact Phone', type: 'text', section: 'Contact' },
    { name: 'contactEmail', label: 'Contact Email', type: 'email', section: 'Contact' },
    { name: 'addressLine1', label: 'Address Line 1', type: 'text', section: 'Address' },
    { name: 'city', label: 'City', type: 'text', section: 'Address' },
    { name: 'state', label: 'State', type: 'text', section: 'Address' },
    { name: 'zipCode', label: 'Zip Code', type: 'text', section: 'Address' },
  ]

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['name', 'code', 'type', 'isActive'] },
    { label: 'Contact', fields: ['contactName', 'contactPhone', 'contactEmail'] },
    { label: 'Address', fields: ['addressLine1', 'city', 'state', 'zipCode'] },
  ]

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId ? `/api/tms/carriers/${recordId}` : '/api/tms/carriers'
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save carrier')
      router.push('/tms/carrier')
    } catch (error) {
      console.error('Error saving carrier:', error)
      throw error
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <WorkspaceSidebar config={tmsWorkspaceConfig} />
      <WorkspaceContent workspaceName="tms" workspaceTitle="Transportation Management" className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-6">
          {mode === 'list' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Carriers</h1>
                <Button onClick={() => router.push('/tms/carrier?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Carrier
                </Button>
              </div>
              <DocTypeList
                doctype="Carrier"
                columns={columns}
                apiEndpoint="/api/tms/carriers"
                onRowClick={(row) => router.push(`/tms/carrier?view=edit&id=${row.id}`)}
                createRoute="/tms/carrier?view=new"
                detailRoute={(id) => `/tms/carrier?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/tms/carrier?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/tms/carrier?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/tms/carrier')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} Carrier
              </h1>
              <DocTypeForm
                doctype="Carrier"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/tms/carrier')}
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


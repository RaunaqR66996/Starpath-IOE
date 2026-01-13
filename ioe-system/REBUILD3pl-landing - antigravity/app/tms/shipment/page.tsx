"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { DocTypeList, TableColumn, FilterConfig } from '@/components/workspace/DocTypeList'
import { DocTypeForm, FormFieldConfig, FormSection, ChildTableConfig } from '@/components/workspace/DocTypeForm'
import { tmsWorkspaceConfig } from '../workspace-config'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ShipmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'list' | 'form'>('list')
  const [recordId, setRecordId] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Check URL params for mode and recordId
  useEffect(() => {
    const view = searchParams.get('view')
    const id = searchParams.get('id')
    
    if (view === 'new' || view === 'edit' || view === 'view') {
      setMode('form')
      if (id) {
        setRecordId(id)
        loadShipmentData(id)
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

  const loadShipmentData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tms/shipments/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load shipment:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = [
    {
      key: 'shipmentNumber',
      label: 'Shipment Number',
      type: 'text',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      sortable: true,
      badgeConfig: {
        getVariant: (value) => {
          const status = value?.toUpperCase() || ''
          if (['DELIVERED', 'COMPLETED'].includes(status)) return 'default'
          if (['IN_TRANSIT', 'PICKED_UP'].includes(status)) return 'secondary'
          if (['CANCELLED', 'EXCEPTION'].includes(status)) return 'destructive'
          return 'outline'
        },
        getLabel: (value) => value || 'Unknown',
      },
    },
    {
      key: 'carrierName',
      label: 'Carrier',
      type: 'text',
      sortable: true,
    },
    {
      key: 'trackingNumber',
      label: 'Tracking Number',
      type: 'text',
    },
    {
      key: 'mode',
      label: 'Mode',
      type: 'text',
      sortable: true,
    },
    {
      key: 'totalWeight',
      label: 'Weight',
      type: 'number',
      render: (value) => value ? `${value} lbs` : '-',
    },
    {
      key: 'totalValue',
      label: 'Value',
      type: 'currency',
    },
    {
      key: 'pickupDate',
      label: 'Pickup Date',
      type: 'date',
      sortable: true,
    },
    {
      key: 'deliveryDate',
      label: 'Delivery Date',
      type: 'date',
    },
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'CREATED', label: 'Created' },
        { value: 'RATED', label: 'Rated' },
        { value: 'LABELED', label: 'Labeled' },
        { value: 'TENDERED', label: 'Tendered' },
        { value: 'PICKED_UP', label: 'Picked Up' },
        { value: 'IN_TRANSIT', label: 'In Transit' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ],
    },
    {
      key: 'mode',
      label: 'Mode',
      type: 'select',
      options: [
        { value: 'PARCEL', label: 'Parcel' },
        { value: 'LTL', label: 'LTL' },
        { value: 'FTL', label: 'FTL' },
        { value: 'INTERMODAL', label: 'Intermodal' },
      ],
    },
  ]

  const formFields: FormFieldConfig[] = [
    {
      name: 'shipmentNumber',
      label: 'Shipment Number',
      type: 'text',
      required: true,
      section: 'Details',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'CREATED', label: 'Created' },
        { value: 'RATED', label: 'Rated' },
        { value: 'LABELED', label: 'Labeled' },
        { value: 'TENDERED', label: 'Tendered' },
        { value: 'PICKED_UP', label: 'Picked Up' },
        { value: 'IN_TRANSIT', label: 'In Transit' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ],
      section: 'Details',
    },
    {
      name: 'mode',
      label: 'Mode',
      type: 'select',
      required: true,
      options: [
        { value: 'PARCEL', label: 'Parcel' },
        { value: 'LTL', label: 'LTL' },
        { value: 'FTL', label: 'FTL' },
        { value: 'INTERMODAL', label: 'Intermodal' },
      ],
      section: 'Details',
    },
    {
      name: 'consolidation',
      label: 'Consolidation',
      type: 'select',
      options: [
        { value: 'NONE', label: 'None' },
        { value: 'MULTI_STOP', label: 'Multi-Stop' },
        { value: 'CONSOLIDATED', label: 'Consolidated' },
      ],
      section: 'Details',
    },
    {
      name: 'carrierId',
      label: 'Carrier',
      type: 'select',
      section: 'Carrier',
    },
    {
      name: 'serviceLevel',
      label: 'Service Level',
      type: 'text',
      section: 'Carrier',
    },
    {
      name: 'trackingNumber',
      label: 'Tracking Number',
      type: 'text',
      section: 'Carrier',
    },
    {
      name: 'referenceNumber',
      label: 'Reference Number',
      type: 'text',
      section: 'Carrier',
    },
    {
      name: 'pickupDate',
      label: 'Pickup Date',
      type: 'date',
      section: 'Timing',
    },
    {
      name: 'deliveryDate',
      label: 'Delivery Date',
      type: 'date',
      section: 'Timing',
    },
    {
      name: 'totalWeight',
      label: 'Total Weight (lbs)',
      type: 'number',
      section: 'Financial',
    },
    {
      name: 'totalValue',
      label: 'Total Value',
      type: 'number',
      section: 'Financial',
    },
    {
      name: 'declaredValue',
      label: 'Declared Value',
      type: 'number',
      section: 'Financial',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      section: 'Additional',
    },
  ]

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['shipmentNumber', 'status', 'mode', 'consolidation'] },
    { label: 'Carrier', fields: ['carrierId', 'serviceLevel', 'trackingNumber', 'referenceNumber'] },
    { label: 'Timing', fields: ['pickupDate', 'deliveryDate'] },
    { label: 'Financial', fields: ['totalWeight', 'totalValue', 'declaredValue'] },
    { label: 'Additional', fields: ['notes'] },
  ]

  const piecesTable: ChildTableConfig = {
    name: 'pieces',
    label: 'Pieces',
    columns: [
      { name: 'sku', label: 'SKU', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'quantity', label: 'Quantity', type: 'number' },
      { name: 'weight', label: 'Weight', type: 'number' },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'unitValue', label: 'Unit Value', type: 'number' },
      { name: 'totalValue', label: 'Total Value', type: 'number' },
    ],
    addRowLabel: 'Add Piece',
  }

  const stopsTable: ChildTableConfig = {
    name: 'stops',
    label: 'Stops',
    columns: [
      { name: 'sequence', label: 'Sequence', type: 'number' },
      { name: 'type', label: 'Type', type: 'select', options: [
        { value: 'PICKUP', label: 'Pickup' },
        { value: 'DELIVERY', label: 'Delivery' },
      ]},
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'addressLine1', label: 'Address Line 1', type: 'text' },
      { name: 'addressLine2', label: 'Address Line 2', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'zipCode', label: 'Zip Code', type: 'text' },
      { name: 'contactName', label: 'Contact Name', type: 'text' },
      { name: 'contactPhone', label: 'Contact Phone', type: 'text' },
      { name: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
    ],
    addRowLabel: 'Add Stop',
  }

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId 
        ? `/api/tms/shipments/${recordId}`
        : '/api/shipments'
      
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to save shipment')
      }

      router.push('/tms/shipment')
    } catch (error) {
      console.error('Error saving shipment:', error)
      throw error
    }
  }

  const handleCancel = () => {
    router.push('/tms/shipment')
  }

  const handleRowClick = (row: any) => {
    router.push(`/tms/shipment?view=edit&id=${row.id}`)
  }

  const handleNew = () => {
    router.push('/tms/shipment?view=new')
  }

  // Load carriers for dropdown
  useEffect(() => {
    if (mode === 'form') {
      const loadCarriers = async () => {
        try {
          const response = await fetch('/api/tms/carriers')
          if (response.ok) {
            const carriers = await response.json()
            const carrierField = formFields.find(f => f.name === 'carrierId')
            if (carrierField) {
              carrierField.options = carriers.map((c: any) => ({
                value: c.id,
                label: c.name || c.carrierName || c.code || 'Unknown',
              }))
            }
          }
        } catch (error) {
          console.error('Failed to load carriers:', error)
        }
      }
      loadCarriers()
    }
  }, [mode])

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <WorkspaceSidebar config={tmsWorkspaceConfig} />
      
      <WorkspaceContent 
        workspaceName="tms"
        workspaceTitle="Transportation Management"
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 overflow-auto p-6">
          {mode === 'list' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
                <Button onClick={handleNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Shipment
                </Button>
              </div>
              
              <DocTypeList
                doctype="Shipment"
                columns={columns}
                apiEndpoint="/api/shipments"
                filters={filters}
                onRowClick={handleRowClick}
                createRoute="/tms/shipment?view=new"
                detailRoute={(id) => `/tms/shipment?view=edit&id=${id}`}
                rowActions={[
                  {
                    label: 'View',
                    action: (row) => router.push(`/tms/shipment?view=view&id=${row.id}`),
                    icon: <Eye className="h-4 w-4 mr-2" />,
                  },
                  {
                    label: 'Edit',
                    action: (row) => router.push(`/tms/shipment?view=edit&id=${row.id}`),
                    icon: <Edit className="h-4 w-4 mr-2" />,
                  },
                ]}
                emptyState={{
                  title: 'No Shipments Found',
                  description: 'Create your first shipment to get started.',
                  action: {
                    label: 'Create Shipment',
                    onClick: handleNew,
                  },
                }}
              />
            </>
          ) : (
            <>
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                  {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} Shipment
                </h1>
              </div>
              
              <DocTypeForm
                doctype="Shipment"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                childTables={[piecesTable, stopsTable]}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
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


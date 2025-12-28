"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { DocTypeList, TableColumn, FilterConfig } from '@/components/workspace/DocTypeList'
import { DocTypeForm, FormFieldConfig, FormSection } from '@/components/workspace/DocTypeForm'
import { tmsWorkspaceConfig } from '../workspace-config'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft, Eye, Edit } from 'lucide-react'

export default function OrderPage() {
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
        loadOrderData(id)
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

  const loadOrderData = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInitialData(data)
      }
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: TableColumn[] = [
    { key: 'orderNumber', label: 'Order Number', type: 'text', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, badgeConfig: {
      getVariant: (v) => {
        const s = v?.toUpperCase() || ''
        if (['COMPLETED', 'SHIPPED'].includes(s)) return 'default'
        if (['PROCESSING', 'READY'].includes(s)) return 'secondary'
        if (['CANCELLED'].includes(s)) return 'destructive'
        return 'outline'
      },
      getLabel: (v) => v || 'Unknown',
    }},
    { key: 'customerName', label: 'Customer', type: 'text' },
    { key: 'totalAmount', label: 'Total', type: 'currency' },
    { key: 'orderDate', label: 'Order Date', type: 'date', sortable: true },
    { key: 'promiseDate', label: 'Promise Date', type: 'date' },
  ]

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'CONFIRMED', label: 'Confirmed' },
        { value: 'PROCESSING', label: 'Processing' },
        { value: 'READY', label: 'Ready' },
        { value: 'SHIPPED', label: 'Shipped' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'CANCELLED', label: 'Cancelled' },
      ],
    },
  ]

  const formFields: FormFieldConfig[] = [
    { name: 'orderNumber', label: 'Order Number', type: 'text', required: true, section: 'Details' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'CONFIRMED', label: 'Confirmed' },
      { value: 'PROCESSING', label: 'Processing' },
      { value: 'READY', label: 'Ready' },
      { value: 'SHIPPED', label: 'Shipped' },
      { value: 'COMPLETED', label: 'Completed' },
      { value: 'CANCELLED', label: 'Cancelled' },
    ], section: 'Details' },
    { name: 'customerId', label: 'Customer', type: 'select', section: 'Customer' },
    { name: 'orderDate', label: 'Order Date', type: 'date', section: 'Details' },
    { name: 'promiseDate', label: 'Promise Date', type: 'date', section: 'Details' },
    { name: 'totalAmount', label: 'Total Amount', type: 'number', section: 'Financial' },
    { name: 'notes', label: 'Notes', type: 'textarea', section: 'Additional' },
  ]

  const formSections: FormSection[] = [
    { label: 'Details', fields: ['orderNumber', 'status', 'orderDate', 'promiseDate'] },
    { label: 'Customer', fields: ['customerId'] },
    { label: 'Financial', fields: ['totalAmount'] },
    { label: 'Additional', fields: ['notes'] },
  ]

  const handleSubmit = async (data: any) => {
    try {
      const url = recordId ? `/api/orders/${recordId}` : '/api/orders'
      const method = recordId ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save order')
      router.push('/tms/order')
    } catch (error) {
      console.error('Error saving order:', error)
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
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <Button onClick={() => router.push('/tms/order?view=new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </div>
              <DocTypeList
                doctype="Order"
                columns={columns}
                apiEndpoint="/api/orders"
                filters={filters}
                onRowClick={(row) => router.push(`/tms/order?view=edit&id=${row.id}`)}
                createRoute="/tms/order?view=new"
                detailRoute={(id) => `/tms/order?view=edit&id=${id}`}
                rowActions={[
                  { label: 'View', action: (row) => router.push(`/tms/order?view=view&id=${row.id}`), icon: <Eye className="h-4 w-4 mr-2" /> },
                  { label: 'Edit', action: (row) => router.push(`/tms/order?view=edit&id=${row.id}`), icon: <Edit className="h-4 w-4 mr-2" /> },
                ]}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/tms/order')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {recordId ? (searchParams.get('view') === 'view' ? 'View' : 'Edit') : 'New'} Order
              </h1>
              <DocTypeForm
                doctype="Order"
                recordId={recordId || undefined}
                mode={searchParams.get('view') === 'view' ? 'view' : recordId ? 'edit' : 'new'}
                fields={formFields}
                sections={formSections}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/tms/order')}
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


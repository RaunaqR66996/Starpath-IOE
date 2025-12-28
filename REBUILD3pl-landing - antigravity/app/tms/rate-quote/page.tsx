"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { DocTypeForm, FormFieldConfig, FormSection } from '@/components/workspace/DocTypeForm'
import { tmsWorkspaceConfig } from '../workspace-config'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function RateQuotePage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    serviceLevel: '',
  })

  const formFields: FormFieldConfig[] = [
    { name: 'origin', label: 'Origin Address', type: 'text', required: true, section: 'Shipment Details' },
    { name: 'destination', label: 'Destination Address', type: 'text', required: true, section: 'Shipment Details' },
    { name: 'weight', label: 'Weight (lbs)', type: 'number', required: true, section: 'Shipment Details' },
    { name: 'length', label: 'Length (in)', type: 'number', section: 'Dimensions' },
    { name: 'width', label: 'Width (in)', type: 'number', section: 'Dimensions' },
    { name: 'height', label: 'Height (in)', type: 'number', section: 'Dimensions' },
    { name: 'serviceLevel', label: 'Service Level', type: 'select', options: [
      { value: 'STANDARD', label: 'Standard' },
      { value: 'EXPRESS', label: 'Express' },
      { value: 'OVERNIGHT', label: 'Overnight' },
    ], section: 'Service' },
  ]

  const formSections: FormSection[] = [
    { label: 'Shipment Details', fields: ['origin', 'destination', 'weight'] },
    { label: 'Dimensions', fields: ['length', 'width', 'height'] },
    { label: 'Service', fields: ['serviceLevel'] },
  ]

  const handleGetQuotes = async (data: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/tms/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        setQuotes(Array.isArray(result) ? result : result.quotes || [])
      }
    } catch (error) {
      console.error('Error getting quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <WorkspaceSidebar config={tmsWorkspaceConfig} />
      <WorkspaceContent workspaceName="tms" workspaceTitle="Transportation Management" className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/tms')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to TMS
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Rate Quote</h1>
            <p className="text-sm text-gray-600 mt-1">
              Get competitive shipping rates from multiple carriers
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quote Request</CardTitle>
              </CardHeader>
              <CardContent>
                <DocTypeForm
                  doctype="Rate Quote"
                  mode="new"
                  fields={formFields}
                  sections={formSections}
                  onSubmit={handleGetQuotes}
                  onCancel={() => router.push('/tms')}
                  actions={[{
                    label: 'Get Quotes',
                    action: handleGetQuotes,
                    variant: 'default',
                  }]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Carrier Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading quotes...</div>
                ) : quotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Enter shipment details and click "Get Quotes" to see carrier rates
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotes.map((quote, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{quote.carrierName || 'Carrier'}</h3>
                          <span className="text-lg font-bold text-blue-600">
                            ${quote.rate?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{quote.serviceLevel || 'Standard'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Est. Delivery: {quote.estimatedDelivery || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </WorkspaceContent>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Upload } from "lucide-react"

interface ASN {
  id: string
  asnNumber: string
  poNumber: string
  expectedItems: number
  expectedQuantity: number
  status: string
  orderDate: string
}

export function InboundASN({ siteId }: { siteId: string }) {
  const [asns, setAsns] = useState<ASN[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchASNs = async () => {
      try {
        const response = await fetch(`/api/wms/receiving?siteId=${siteId}&action=pending`)
        const data = await response.json()
        
        if (data.success && data.data) {
          setAsns(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch ASNs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchASNs()
  }, [siteId])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'success'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  if (loading) {
    return <div className="text-xs text-gray-500">Loading ASNs...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">ASN Processing</span>
        <Button size="sm" variant="outline" className="h-6 text-xs">
          <Upload className="h-3 w-3 mr-1" />
          Import ASN
        </Button>
      </div>
      
      <div className="space-y-0.5">
        {asns.length === 0 ? (
          <div className="text-xs text-gray-500 p-2">No pending ASNs</div>
        ) : (
          asns.map((asn) => (
            <div key={asn.poNumber} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{asn.poNumber}</div>
                  <Badge variant={getStatusVariant(asn.status) as any} className="text-xs px-1 py-0">
                    {asn.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0">{asn.expectedItems} items</div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Expected Qty: {asn.expectedQuantity}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


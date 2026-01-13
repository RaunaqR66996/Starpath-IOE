"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Truck } from "lucide-react"

interface Shipment {
  id: string
  shipmentNumber: string
  orderNumber: string
  carrier: string
  status: string
  trackingNumber: string
}

const mockShipments: Shipment[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function OutboundShipping({ siteId }: { siteId: string }) {
  const [shipments] = useState<Shipment[]>(mockShipments)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SHIPPED': return 'success'
      case 'READY': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Shipping</span>
        <Badge variant="outline" className="text-xs">{shipments.length} Shipments</Badge>
      </div>
      
      <div className="space-y-0.5">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Truck className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{shipment.shipmentNumber}</div>
                <Badge variant={getStatusVariant(shipment.status) as any} className="text-xs px-1 py-0">
                  {shipment.status}
                </Badge>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {shipment.orderNumber} • {shipment.carrier} {shipment.trackingNumber && `• ${shipment.trackingNumber}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


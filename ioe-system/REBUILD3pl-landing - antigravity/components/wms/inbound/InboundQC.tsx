"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"

interface QCItem {
  id: string
  receiptNumber: string
  item: string
  status: string
  inspector: string
}

const mockQCItems: QCItem[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function InboundQC({ siteId }: { siteId: string }) {
  const [qcItems] = useState<QCItem[]>(mockQCItems)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Quality Control</span>
        <Badge variant="outline" className="text-xs">2 Pending</Badge>
      </div>
      
      <div className="space-y-0.5">
        {qcItems.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{item.receiptNumber}</div>
                {item.status === 'PASSED' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-600" />
                )}
                <Badge variant={item.status === 'PASSED' ? 'success' : 'destructive'} className="text-xs px-1 py-0">
                  {item.status}
                </Badge>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{item.item} • Inspector: {item.inspector}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


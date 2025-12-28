"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Database2 } from "lucide-react"

interface MasterDataItem {
  id: string
  name: string
  type: string
  recordCount: number
}

const mockMasterData: MasterDataItem[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ConfigMasterData({ siteId }: { siteId: string }) {
  const [masterData] = useState<MasterDataItem[]>(mockMasterData)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Master Data</span>
        <Badge variant="outline" className="text-xs">{masterData.length} Types</Badge>
      </div>
      
      <div className="space-y-0.5">
        {masterData.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Database2 className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{item.name}</div>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {item.type}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{item.recordCount} records</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


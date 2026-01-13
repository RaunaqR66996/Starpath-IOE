"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"

interface Setting {
  id: string
  name: string
  category: string
  value: string
}

const mockSettings: Setting[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ConfigSettings({ siteId }: { siteId: string }) {
  const [settings] = useState<Setting[]>(mockSettings)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">System Settings</span>
        <Badge variant="outline" className="text-xs">{settings.length} Settings</Badge>
      </div>
      
      <div className="space-y-0.5">
        {settings.map((setting) => (
          <div key={setting.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Settings className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{setting.name}</div>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {setting.category}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{setting.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

interface Report {
  id: string
  reportName: string
  type: string
  lastGenerated: string
}

const mockReports: Report[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ReportsAnalytics({ siteId }: { siteId: string }) {
  const [reports] = useState<Report[]>(mockReports)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Reports & Analytics</span>
        <Button size="sm" variant="outline" className="h-6 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Generate
        </Button>
      </div>
      
      <div className="space-y-0.5">
        {reports.map((report) => (
          <div key={report.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{report.reportName}</div>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {report.type}
                </Badge>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Last Generated: {report.lastGenerated}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


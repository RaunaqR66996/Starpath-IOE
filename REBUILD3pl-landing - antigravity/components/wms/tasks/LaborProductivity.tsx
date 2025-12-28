"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface Worker {
  id: string
  name: string
  tasksCompleted: number
  efficiency: number
  status: string
}

const mockWorkers: Worker[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function LaborProductivity({ siteId }: { siteId: string }) {
  const [workers] = useState<Worker[]>(mockWorkers)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Labor Productivity</span>
        <Badge variant="outline" className="text-xs">{workers.length} Workers</Badge>
      </div>
      
      <div className="space-y-0.5">
        {workers.map((worker) => (
          <div key={worker.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Users className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{worker.name}</div>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {worker.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{worker.efficiency}%</div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Tasks Completed: {worker.tasksCompleted}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


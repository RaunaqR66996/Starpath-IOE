"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface Assignment {
  id: string
  workerName: string
  taskType: string
  taskCount: number
  status: string
}

const mockAssignments: Assignment[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function WorkerAssignment({ siteId }: { siteId: string }) {
  const [assignments] = useState<Assignment[]>(mockAssignments)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Worker Assignment</span>
        <Badge variant="outline" className="text-xs">{assignments.length} Assignments</Badge>
      </div>
      
      <div className="space-y-0.5">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Users className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{assignment.workerName}</div>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {assignment.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{assignment.taskCount} tasks</div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{assignment.taskType}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


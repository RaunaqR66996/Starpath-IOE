"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ClipboardList } from "lucide-react"

interface Task {
  id: string
  taskNumber: string
  type: string
  assignee: string | null
  status: string
  priority: string
}

export function TaskManagement({ siteId }: { siteId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/wms/tasks?siteId=${siteId}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          setTasks(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [siteId])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success'
      case 'IN_PROGRESS': return 'secondary'
      case 'ASSIGNED': return 'warning'
      default: return 'default'
    }
  }

  if (loading) {
    return <div className="text-xs text-gray-500">Loading tasks...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Task Management</span>
        <Badge variant="outline" className="text-xs">{tasks.length} Tasks</Badge>
      </div>
      
      <div className="space-y-0.5">
        {tasks.length === 0 ? (
          <div className="text-xs text-gray-500 p-2">No active tasks</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <ClipboardList className="h-3 w-3 text-gray-500" />
                  <div className="text-xs font-medium truncate">{task.taskNumber}</div>
                  <Badge variant={getStatusVariant(task.status) as any} className="text-xs px-1 py-0">
                    {task.status}
                  </Badge>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {task.type} • {task.assignee || 'Unassigned'} • Priority: {task.priority}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


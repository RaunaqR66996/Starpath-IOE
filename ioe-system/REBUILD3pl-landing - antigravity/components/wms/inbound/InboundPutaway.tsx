"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowDown } from "lucide-react"

interface PutawayTask {
  id: string
  receiptNumber: string
  itemSku: string
  itemName: string
  quantity: number
  suggestedLocation: string
  status: string
}

export function InboundPutaway({ siteId }: { siteId: string }) {
  const [tasks, setTasks] = useState<PutawayTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/wms/putaway?siteId=${siteId}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          setTasks(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch putaway tasks:', error)
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
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  if (loading) {
    return <div className="text-xs text-gray-500">Loading putaway tasks...</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Putaway Tasks</span>
        <Badge variant="outline" className="text-xs">{tasks.length} Active</Badge>
      </div>
      
      <div className="space-y-0.5">
        {tasks.length === 0 ? (
          <div className="text-xs text-gray-500 p-2">No putaway tasks</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <ArrowDown className="h-3 w-3 text-gray-500" />
                  <div className="text-xs font-medium truncate">{task.receiptNumber}</div>
                  <Badge variant={getStatusVariant(task.status) as any} className="text-xs px-1 py-0">
                    {task.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0">Qty: {task.quantity}</div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{task.itemName || task.itemSku} • Suggested: {task.suggestedLocation}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


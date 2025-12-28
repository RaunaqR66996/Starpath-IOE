// WMS Tasks Hook - Real-time task management
// Integrates task APIs with React components

import { useState, useEffect, useCallback } from 'react'
import { useWmsWebSocket } from './use-wms-websocket'

interface WarehouseTask {
  id: string
  siteId: string
  orderId?: string
  assignedUserId?: string
  type: 'RECEIVING' | 'PUTAWAY' | 'PICKING' | 'PACKING' | 'SHIPPING' | 'CYCLE_COUNT' | 'REPLENISHMENT' | 'TRANSFER'
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  details: any
  createdAt: string
  updatedAt: string
  assignedUser?: {
    name: string
    email: string
  }
  order?: {
    orderNumber: string
    customer: {
      name: string
    }
  }
}

interface TaskSummary {
  siteId: string
  type: string
  status: string
  priority: string
  count: number
  lastUpdated: string
}

interface UseWmsTasksOptions {
  siteId: string
  type?: string
  status?: string
  assignedUserId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useWmsTasks(options: UseWmsTasksOptions) {
  const [tasks, setTasks] = useState<WarehouseTask[]>([])
  const [summary, setSummary] = useState<TaskSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    subscribeTasks, 
    onTaskUpdate, 
    isConnected 
  } = useWmsWebSocket()

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        siteId: options.siteId,
        ...(options.type && { type: options.type }),
        ...(options.status && { status: options.status }),
        ...(options.assignedUserId && { assignedUserId: options.assignedUserId })
      })

      const response = await fetch(`/api/wms/tasks?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        setTasks(data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch tasks')
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [options.siteId, options.type, options.status, options.assignedUserId])

  // Fetch task summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/wms/tasks/summary?siteId=${options.siteId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch task summary: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        setSummary(data.data)
      }
    } catch (err) {
      console.error('Error fetching task summary:', err)
    }
  }, [options.siteId])

  // Create task
  const createTask = useCallback(async (
    orderId: string | undefined,
    type: string,
    priority: string,
    details: any,
    actorId: string,
    tenantId: string
  ) => {
    try {
      const response = await fetch('/api/wms/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siteId: options.siteId,
          orderId,
          type,
          priority,
          details,
          actorId,
          tenantId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        // Refresh tasks after successful creation
        await fetchTasks()
        return data.data
      } else {
        throw new Error(data.message || 'Failed to create task')
      }
    } catch (err) {
      console.error('Error creating task:', err)
      throw err
    }
  }, [options.siteId, fetchTasks])

  // Assign task
  const assignTask = useCallback(async (
    taskId: string,
    assignedUserId: string,
    actorId: string,
    tenantId: string
  ) => {
    try {
      const response = await fetch(`/api/wms/tasks/${taskId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignedUserId,
          actorId,
          tenantId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to assign task: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        // Refresh tasks after successful assignment
        await fetchTasks()
        return data.data
      } else {
        throw new Error(data.message || 'Failed to assign task')
      }
    } catch (err) {
      console.error('Error assigning task:', err)
      throw err
    }
  }, [fetchTasks])

  // Start task
  const startTask = useCallback(async (
    taskId: string,
    actorId: string,
    tenantId: string
  ) => {
    try {
      const response = await fetch(`/api/wms/tasks/${taskId}/start`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actorId,
          tenantId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start task: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        // Refresh tasks after successful start
        await fetchTasks()
        return data.data
      } else {
        throw new Error(data.message || 'Failed to start task')
      }
    } catch (err) {
      console.error('Error starting task:', err)
      throw err
    }
  }, [fetchTasks])

  // Complete task
  const completeTask = useCallback(async (
    taskId: string,
    completionData: any,
    actorId: string,
    tenantId: string
  ) => {
    try {
      const response = await fetch(`/api/wms/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completionData,
          actorId,
          tenantId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to complete task: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        // Refresh tasks after successful completion
        await fetchTasks()
        return data.data
      } else {
        throw new Error(data.message || 'Failed to complete task')
      }
    } catch (err) {
      console.error('Error completing task:', err)
      throw err
    }
  }, [fetchTasks])

  // Set up WebSocket subscription
  useEffect(() => {
    if (isConnected) {
      subscribeTasks(options.siteId, options.assignedUserId)
    }
  }, [isConnected, subscribeTasks, options.siteId, options.assignedUserId])

  // Set up real-time updates
  useEffect(() => {
    const handleTaskUpdate = (data: any) => {
      console.log('Task updated:', data)
      // Refresh tasks when real-time updates arrive
      fetchTasks()
    }

    onTaskUpdate(handleTaskUpdate)
  }, [onTaskUpdate, fetchTasks])

  // Initial data fetch
  useEffect(() => {
    fetchTasks()
    fetchSummary()
  }, [fetchTasks, fetchSummary])

  // Auto-refresh if enabled
  useEffect(() => {
    if (!options.autoRefresh) return

    const interval = setInterval(() => {
      fetchTasks()
      fetchSummary()
    }, options.refreshInterval || 30000) // Default 30 seconds

    return () => clearInterval(interval)
  }, [options.autoRefresh, options.refreshInterval, fetchTasks, fetchSummary])

  return {
    tasks,
    summary,
    loading,
    error,
    fetchTasks,
    fetchSummary,
    createTask,
    assignTask,
    startTask,
    completeTask,
    isConnected
  }
}


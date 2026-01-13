"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ClipboardList, 
  Play, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Package,
  Filter,
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface Task {
  id: string
  type: string
  status: string
  priority: string
  quantity: number
  assignee?: string
  dueAt?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  fromLocation?: {
    id: string
    type: string
    zone?: string
    aisle?: string
    bay?: string
    level?: string
  }
  toLocation?: {
    id: string
    type: string
    zone?: string
    aisle?: string
    bay?: string
    level?: string
  }
  item?: {
    sku: string
    name: string
  }
  metadata?: string
}

interface TasksPanelProps {
  siteId: string
  onTaskAction?: (taskId: string, action: 'start' | 'complete') => void
  onLocationClick?: (locationId: string) => void
  isReadOnly?: boolean
}

export function TasksPanel({ 
  siteId, 
  onTaskAction, 
  onLocationClick,
  isReadOnly = false 
}: TasksPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/wms/${siteId}/tasks?${params}`)
      const data = await response.json()

      if (data.success) {
        setTasks(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [siteId, typeFilter, statusFilter])

  useEffect(() => {
    if (siteId) {
      fetchTasks()
    }
  }, [siteId, fetchTasks])

  const handleTaskAction = async (taskId: string, action: 'start' | 'complete') => {
    if (isReadOnly) return

    try {
      setActionLoading(taskId)
      const response = await fetch(`/api/wms/${siteId}/tasks/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()
      if (data.success) {
        // Refresh tasks
        await fetchTasks()
        onTaskAction?.(taskId, action)
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'PICK':
        return <Package className="h-4 w-4 text-blue-500" />
      case 'PACK':
        return <Package className="h-4 w-4 text-green-500" />
      case 'REPLEN':
        return <Package className="h-4 w-4 text-orange-500" />
      case 'PUTAWAY':
        return <MapPin className="h-4 w-4 text-purple-500" />
      case 'CYCLE_COUNT':
        return <ClipboardList className="h-4 w-4 text-yellow-500" />
      case 'TRANSFER':
        return <MapPin className="h-4 w-4 text-indigo-500" />
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'IN_PROGRESS':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'CANCELLED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatLocation = (location?: Task['fromLocation']) => {
    if (!location) return 'N/A'
    const parts = [location.zone, location.aisle, location.bay, location.level].filter(Boolean)
    return parts.join('-') || 'Unknown'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleTimeString()
  }

  const filteredTasks = tasks.filter(task => {
    if (typeFilter !== 'all' && task.type !== typeFilter) return false
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    return true
  })

  return (
    <Card className="uber-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="uber-heading-3 flex items-center space-x-2">
            <ClipboardList className="h-5 w-5" />
            <span>Tasks</span>
            <Badge variant="outline">{filteredTasks.length}</Badge>
          </CardTitle>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 uber-select">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PICK">Pick</SelectItem>
              <SelectItem value="PACK">Pack</SelectItem>
              <SelectItem value="REPLEN">Replen</SelectItem>
              <SelectItem value="PUTAWAY">Putaway</SelectItem>
              <SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 uber-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No tasks found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-3 border-b last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTaskIcon(task.type)}
                    <span className="font-medium text-sm">{task.type}</span>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(task.createdAt)}
                  </span>
                </div>

                {/* Task Details */}
                <div className="space-y-1 text-xs text-gray-600">
                  {task.item && (
                    <div className="flex justify-between">
                      <span>Item:</span>
                      <span>{task.item.sku} - {task.item.name}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>{task.quantity}</span>
                  </div>

                  {task.fromLocation && (
                    <div className="flex justify-between">
                      <span>From:</span>
                      <span 
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => onLocationClick?.(task.fromLocation!.id)}
                      >
                        {formatLocation(task.fromLocation)}
                      </span>
                    </div>
                  )}

                  {task.toLocation && (
                    <div className="flex justify-between">
                      <span>To:</span>
                      <span 
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => onLocationClick?.(task.toLocation!.id)}
                      >
                        {formatLocation(task.toLocation)}
                      </span>
                    </div>
                  )}

                  {task.assignee && (
                    <div className="flex justify-between">
                      <span>Assignee:</span>
                      <span>{task.assignee}</span>
                    </div>
                  )}

                  {task.dueAt && (
                    <div className="flex justify-between">
                      <span>Due:</span>
                      <span>{formatDate(task.dueAt)} {formatTime(task.dueAt)}</span>
                    </div>
                  )}

                  {task.startedAt && (
                    <div className="flex justify-between">
                      <span>Started:</span>
                      <span>{formatTime(task.startedAt)}</span>
                    </div>
                  )}

                  {task.completedAt && (
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span>{formatTime(task.completedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!isReadOnly && (
                  <div className="flex space-x-1 mt-2">
                    {task.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleTaskAction(task.id, 'start')}
                        disabled={actionLoading === task.id}
                      >
                        {actionLoading === task.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Start
                      </Button>
                    )}
                    
                    {task.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleTaskAction(task.id, 'complete')}
                        disabled={actionLoading === task.id}
                      >
                        {actionLoading === task.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        Complete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}





























































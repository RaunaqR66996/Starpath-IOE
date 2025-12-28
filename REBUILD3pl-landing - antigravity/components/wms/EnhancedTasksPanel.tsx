// Enhanced Tasks Panel with Real-time Updates
// Integrates with WMS task APIs and WebSocket for live task management

"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ClipboardList, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Plus,
  Filter,
  Search
} from 'lucide-react'
import { useWmsTasks } from '@/lib/hooks/use-wms-tasks'
import { AIPickPathing } from './AIPickPathing'

interface EnhancedTasksPanelProps {
  siteId: string
  userId?: string
  onTaskSelect?: (taskId: string) => void
  onTaskUpdate?: (task: any) => void
}

export function EnhancedTasksPanel({ 
  siteId, 
  userId, 
  onTaskSelect, 
  onTaskUpdate 
}: EnhancedTasksPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAI, setShowAI] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  // Use WMS tasks hook for real-time data
  const {
    tasks,
    summary,
    loading,
    error,
    fetchTasks,
    createTask,
    assignTask,
    startTask,
    completeTask,
    isConnected
  } = useWmsTasks({
    siteId,
    assignedUserId: userId,
    autoRefresh: true,
    refreshInterval: 30000
  })

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || task.type === typeFilter
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800'
      case 'NORMAL': return 'bg-blue-100 text-blue-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Handle task actions
  const handleAssignTask = useCallback(async (taskId: string) => {
    try {
      await assignTask(
        taskId,
        userId || 'current-user', // TODO: Get from auth context
        'current-user', // TODO: Get from auth context
        'default-tenant' // TODO: Get from auth context
      )
      onTaskUpdate?.(tasks.find(t => t.id === taskId))
    } catch (err) {
      console.error('Error assigning task:', err)
    }
  }, [assignTask, userId, tasks, onTaskUpdate])

  const handleStartTask = useCallback(async (taskId: string) => {
    try {
      await startTask(
        taskId,
        'current-user', // TODO: Get from auth context
        'default-tenant' // TODO: Get from auth context
      )
      onTaskUpdate?.(tasks.find(t => t.id === taskId))
    } catch (err) {
      console.error('Error starting task:', err)
    }
  }, [startTask, tasks, onTaskUpdate])

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      await completeTask(
        taskId,
        { completedAt: new Date().toISOString() }, // TODO: Add completion data
        'current-user', // TODO: Get from auth context
        'default-tenant' // TODO: Get from auth context
      )
      onTaskUpdate?.(tasks.find(t => t.id === taskId))
    } catch (err) {
      console.error('Error completing task:', err)
    }
  }, [completeTask, tasks, onTaskUpdate])

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Live updates enabled</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Offline mode</span>
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summary.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.status}
                  </p>
                  <p className="text-2xl font-bold">{item.count}</p>
                </div>
                <Badge className={getStatusColor(item.status)}>
                  {item.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="RECEIVING">Receiving</SelectItem>
            <SelectItem value="PUTAWAY">Putaway</SelectItem>
            <SelectItem value="PICKING">Picking</SelectItem>
            <SelectItem value="PACKING">Packing</SelectItem>
            <SelectItem value="SHIPPING">Shipping</SelectItem>
            <SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAI(!showAI)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showAI ? 'Hide' : 'Show'} AI
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTasks}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* AI Pick Pathing */}
      {showAI && selectedTask && (
        <AIPickPathing
          taskId={selectedTask.id}
          items={selectedTask.details?.items || []}
          onPathGenerated={(path) => {
            console.log('Generated path:', path)
          }}
          onPathApplied={(path) => {
            console.log('Applied path:', path)
          }}
        />
      )}

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Tasks
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchTasks}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedTask?.id === task.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedTask(task)
                    onTaskSelect?.(task.id)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{task.id}</span>
                      </div>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {task.type}
                      </div>
                      {task.order && (
                        <div className="text-sm text-muted-foreground">
                          Order: {task.order.orderNumber}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {task.assignedUser ? task.assignedUser.name : 'Unassigned'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      <div className="flex gap-1">
                        {task.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAssignTask(task.id)
                            }}
                          >
                            <User className="h-3 w-3" />
                          </Button>
                        )}
                        {task.status === 'ASSIGNED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartTask(task.id)
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCompleteTask(task.id)
                            }}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


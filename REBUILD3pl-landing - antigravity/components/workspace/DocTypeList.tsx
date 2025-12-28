"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export type ColumnType = 'text' | 'number' | 'date' | 'badge' | 'currency' | 'link'

export interface TableColumn {
  key: string
  label: string
  type?: ColumnType
  sortable?: boolean
  width?: string
  render?: (value: any, row: any) => React.ReactNode
  badgeConfig?: {
    getVariant: (value: any) => 'default' | 'secondary' | 'destructive' | 'outline'
    getLabel: (value: any) => string
  }
}

export interface FilterConfig {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange'
  options?: { value: string; label: string }[]
  placeholder?: string
}

export interface ListAction {
  label: string
  action: (row: any) => void | Promise<void>
  icon?: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline'
  requiresSelection?: boolean
}

export interface DocTypeListProps {
  doctype: string
  columns: TableColumn[]
  apiEndpoint: string
  filters?: FilterConfig[]
  actions?: ListAction[]
  rowActions?: Array<{
    label: string
    action: (row: any) => void | Promise<void>
    icon?: React.ReactNode
    variant?: 'default' | 'destructive'
  }>
  onRowClick?: (row: any) => void
  getRowId?: (row: any) => string
  pageSize?: number
  createRoute?: string
  detailRoute?: (id: string) => string
  emptyState?: {
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
    }
  }
}

type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
} | null

export function DocTypeList({
  doctype,
  columns,
  apiEndpoint,
  filters = [],
  actions = [],
  rowActions = [],
  onRowClick,
  getRowId = (row) => row.id,
  pageSize = 20,
  createRoute,
  detailRoute,
  emptyState,
}: DocTypeListProps) {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        if (searchTerm) {
          params.append('search', searchTerm)
        }
        
        if (sortConfig) {
          params.append('sortBy', sortConfig.key)
          params.append('sortOrder', sortConfig.direction)
        }
        
        Object.entries(filterValues).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            params.append(key, value.toString())
          }
        })
        
        const response = await fetch(`${apiEndpoint}?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${doctype} data`)
        }
        
        const result = await response.json()
        
        // Handle different response formats
        if (Array.isArray(result)) {
          setData(result)
          setTotalCount(result.length)
          setTotalPages(Math.ceil(result.length / pageSize))
        } else if (result.data && Array.isArray(result.data)) {
          setData(result.data)
          setTotalCount(result.total || result.count || result.data.length)
          setTotalPages(result.totalPages || Math.ceil((result.total || result.data.length) / pageSize))
        } else {
          setData([])
          setTotalCount(0)
          setTotalPages(1)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setData([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [apiEndpoint, page, pageSize, sortConfig, searchTerm, filterValues, doctype])

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }))
    setPage(1) // Reset to first page on filter change
  }

  const handleRowClick = (row: any) => {
    if (onRowClick) {
      onRowClick(row)
    } else if (detailRoute) {
      const id = getRowId(row)
      router.push(detailRoute(id))
    }
  }

  const handleSelectRow = (rowId: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(rowId)
      } else {
        newSet.delete(rowId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(data.map((row) => getRowId(row))))
    } else {
      setSelectedRows(new Set())
    }
  }

  const renderCell = (column: TableColumn, row: any) => {
    const value = row[column.key]
    
    if (column.render) {
      return column.render(value, row)
    }
    
    switch (column.type) {
      case 'badge':
        if (column.badgeConfig) {
          return (
            <Badge variant={column.badgeConfig.getVariant(value)}>
              {column.badgeConfig.getLabel(value)}
            </Badge>
          )
        }
        return <Badge>{value}</Badge>
      
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-'
      
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value
      
      case 'currency':
        return typeof value === 'number' 
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
          : value
      
      case 'link':
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {value}
          </a>
        )
      
      default:
        return value ?? '-'
    }
  }

  const getSortIcon = (column: TableColumn) => {
    if (!sortConfig || sortConfig.key !== column.key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  const selectedRowsArray = useMemo(() => {
    return data.filter((row) => selectedRows.has(getRowId(row)))
  }, [data, selectedRows, getRowId])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          {filters.map((filter) => (
            <div key={filter.key} className="w-48">
              {filter.type === 'select' ? (
                <Select
                  value={filterValues[filter.key] || ''}
                  onValueChange={(value) => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={filter.label}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectedRows.size > 0 && actions.some((a) => a.requiresSelection) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions ({selectedRows.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {actions
                  .filter((a) => a.requiresSelection)
                  .map((action, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={() => {
                        action.action(selectedRowsArray)
                        setSelectedRows(new Set())
                      }}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Export */}
          <Button variant="outline" size="sm" onClick={() => {
            // TODO: Implement export
            console.log('Export data')
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {/* Create Button */}
          {createRoute && (
            <Button
              size="sm"
              onClick={() => router.push(createRoute)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New {doctype}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-600">
              {error}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-lg font-semibold mb-2">
                {emptyState?.title || `No ${doctype} found`}
              </p>
              <p className="text-sm mb-4">
                {emptyState?.description || `No ${doctype.toLowerCase()} match your filters.`}
              </p>
              {emptyState?.action && (
                <Button onClick={emptyState.action.onClick} size="sm">
                  {emptyState.action.label}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {actions.some((a) => a.requiresSelection) && (
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === data.length && data.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                    )}
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                        onClick={() => column.sortable && handleSort(column.key)}
                        style={{ width: column.width }}
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable && getSortIcon(column)}
                        </div>
                      </TableHead>
                    ))}
                    {rowActions.length > 0 && (
                      <TableHead className="w-12">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => {
                    const rowId = getRowId(row)
                    const isSelected = selectedRows.has(rowId)
                    return (
                      <TableRow
                        key={rowId}
                        className={onRowClick || detailRoute ? 'cursor-pointer hover:bg-gray-50' : ''}
                        onClick={() => handleRowClick(row)}
                      >
                        {actions.some((a) => a.requiresSelection) && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleSelectRow(rowId, e.target.checked)
                              }}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                        )}
                        {columns.map((column) => (
                          <TableCell key={column.key}>
                            {renderCell(column, row)}
                          </TableCell>
                        ))}
                        {rowActions.length > 0 && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {rowActions.map((action, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={() => action.action(row)}
                                    className={action.variant === 'destructive' ? 'text-red-600' : ''}
                                  >
                                    {action.icon}
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


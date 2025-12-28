"use client"

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Building2, 
  Users, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface WarehouseSite {
  id: string
  name: string
  type: 'OWN' | 'PARTNER'
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  isReadOnly: boolean
  address?: string
  timezone: string
  openTasksCount: number
  health: 'online' | 'offline'
}

interface SiteSwitcherProps {
  selectedSiteId?: string
  onSiteChange: (siteId: string) => void
  isReadOnly?: boolean
}

export const SiteSwitcher = memo(function SiteSwitcher({ selectedSiteId, onSiteChange, isReadOnly = false }: SiteSwitcherProps) {
  const [sites, setSites] = useState<WarehouseSite[]>([])
  const [loading, setLoading] = useState(true)
  
  // Memoize the onSiteChange handler to prevent unnecessary re-renders
  const handleSiteChange = useCallback((value: string) => {
    if (value !== selectedSiteId) {
      onSiteChange(value)
    }
  }, [onSiteChange, selectedSiteId])

  const fetchSites = useCallback(async () => {
    try {
      setLoading(true)
      const [ownResponse, partnerResponse] = await Promise.all([
        fetch('/api/wms/sites?scope=own'),
        fetch('/api/wms/sites?scope=partner')
      ])

      const ownData = await ownResponse.json()
      const partnerData = await partnerResponse.json()

      const allSites = [] as WarehouseSite[]
      if (ownData.success) {
        allSites.push(...ownData.data)
      }
      if (partnerData.success) {
        allSites.push(...partnerData.data)
      }

      setSites(allSites)
      // Auto-select first site if none is selected
      if (!selectedSiteId && allSites.length > 0) {
        onSiteChange(allSites[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedSiteId, onSiteChange])

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  const getStatusIcon = useCallback((status: string, health: string) => {
    if (health === 'offline') {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'MAINTENANCE':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'INACTIVE':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }, [])

  const getStatusColor = useCallback((status: string, health: string) => {
    if (health === 'offline') return 'bg-red-100 text-red-800'
    
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800'
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const selectedSite = useMemo(() => 
    sites.find(site => site.id === selectedSiteId), 
    [sites, selectedSiteId]
  )

  // Ensure stable value for Select component
  const selectValue = useMemo(() => selectedSiteId || '', [selectedSiteId])

  // Memoized Select component to prevent unnecessary re-renders
  const MemoizedSelect = useMemo(() => (
    <Select 
      value={selectValue} 
      onValueChange={handleSiteChange}
      key={`select-${selectValue}`}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a warehouse..." />
      </SelectTrigger>
      <SelectContent>
        {sites.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Building2 className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No warehouses found</p>
          </div>
        ) : (
          sites.map((site) => (
            <SelectItem key={site.id} value={site.id} disabled={isReadOnly && site.type === 'PARTNER'}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  {site.type === 'OWN' ? (
                    <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Users className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{site.name}</p>
                    <p className="text-xs text-gray-600 truncate">{site.address || 'No address'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                  {getStatusIcon(site.status, site.health)}
                  {site.openTasksCount > 0 && (
                    <Badge variant="outline" className="text-xs px-1">
                      <Clock className="h-2 w-2 mr-1" />
                      {site.openTasksCount}
                    </Badge>
                  )}
                  {site.type === 'PARTNER' && (
                    <Badge variant="outline" className="text-xs px-1">
                      Read Only
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  ), [selectValue, handleSiteChange, sites, isReadOnly, getStatusIcon])

  if (loading) {
    return (
      <Card className="uber-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Loading sites...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="uber-card w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Current Site Display */}
          {selectedSite && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {selectedSite.type === 'OWN' ? (
                    <Building2 className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Users className="h-4 w-4 text-purple-600" />
                  )}
                  <div>
                    <h3 className="font-medium text-sm text-gray-900">{selectedSite.name}</h3>
                    <p className="text-xs text-gray-600">
                      {selectedSite.type === 'OWN' ? 'Own Warehouse' : 'Partner Warehouse'}
                      {selectedSite.isReadOnly && ' (Read Only)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedSite.status, selectedSite.health)}
                  <Badge className={`${getStatusColor(selectedSite.status, selectedSite.health)} text-xs`}>
                    {selectedSite.status.toLowerCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Warehouse Dropdown Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Switch Warehouse</label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={fetchSites}
                  disabled={loading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {selectedSite && selectedSite.type === 'OWN' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={isReadOnly}
                  >
                    <Building2 className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                )}
              </div>
            </div>
            
            {MemoizedSelect}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

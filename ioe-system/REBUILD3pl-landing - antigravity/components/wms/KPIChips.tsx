"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Truck, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface KPIData {
  inventory: {
    onHand: number
    allocated: number
    available: number
  }
  tasks: {
    pending: number
    inProgress: number
    completed: number
    total: number
  }
  dockAppointments: {
    today: number
  }
}

interface KPIChipsProps {
  siteId: string
  onKpiClick?: (kpiType: string) => void
}

export function KPIChips({ siteId, onKpiClick }: KPIChipsProps) {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (siteId) {
      fetchKPIs()
    }
  }, [siteId])

  const fetchKPIs = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/wms/${siteId}/kpis`)
      const data = await response.json()

      if (data.success) {
        setKpis(data.data)
      } else {
        setError('Failed to fetch KPIs')
      }
    } catch (err) {
      setError('Failed to fetch KPIs')
      console.error('KPI fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (current: number, previous?: number) => {
    if (previous === undefined) return <Minus className="h-3 w-3 text-gray-400" />
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getKpiColor = (type: string, value: number) => {
    switch (type) {
      case 'onHand':
        return value > 10000 ? 'text-green-600' : value > 1000 ? 'text-blue-600' : 'text-gray-600'
      case 'allocated':
        return value > 5000 ? 'text-orange-600' : 'text-blue-600'
      case 'available':
        return value > 5000 ? 'text-green-600' : value > 1000 ? 'text-blue-600' : 'text-red-600'
      case 'pending':
        return value > 50 ? 'text-red-600' : value > 20 ? 'text-orange-600' : 'text-green-600'
      case 'inProgress':
        return value > 30 ? 'text-orange-600' : 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'dockAppointments':
        return value > 10 ? 'text-blue-600' : 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getKpiBadgeColor = (type: string, value: number) => {
    switch (type) {
      case 'onHand':
        return value > 10000 ? 'bg-green-100 text-green-800' : value > 1000 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
      case 'allocated':
        return value > 5000 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
      case 'available':
        return value > 5000 ? 'bg-green-100 text-green-800' : value > 1000 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
      case 'pending':
        return value > 50 ? 'bg-red-100 text-red-800' : value > 20 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
      case 'inProgress':
        return value > 30 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'dockAppointments':
        return value > 10 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex space-x-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="uber-card">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !kpis) {
    return (
      <Card className="uber-card">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error || 'Failed to load KPIs'}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const kpiItems = [
    {
      id: 'onHand',
      label: 'On Hand',
      value: kpis.inventory.onHand,
      icon: Package,
      color: getKpiColor('onHand', kpis.inventory.onHand),
      badgeColor: getKpiBadgeColor('onHand', kpis.inventory.onHand)
    },
    {
      id: 'allocated',
      label: 'Allocated',
      value: kpis.inventory.allocated,
      icon: CheckCircle,
      color: getKpiColor('allocated', kpis.inventory.allocated),
      badgeColor: getKpiBadgeColor('allocated', kpis.inventory.allocated)
    },
    {
      id: 'available',
      label: 'Available',
      value: kpis.inventory.available,
      icon: Package,
      color: getKpiColor('available', kpis.inventory.available),
      badgeColor: getKpiBadgeColor('available', kpis.inventory.available)
    },
    {
      id: 'pending',
      label: 'Pending Tasks',
      value: kpis.tasks.pending,
      icon: Clock,
      color: getKpiColor('pending', kpis.tasks.pending),
      badgeColor: getKpiBadgeColor('pending', kpis.tasks.pending)
    },
    {
      id: 'inProgress',
      label: 'In Progress',
      value: kpis.tasks.inProgress,
      icon: Clock,
      color: getKpiColor('inProgress', kpis.tasks.inProgress),
      badgeColor: getKpiBadgeColor('inProgress', kpis.tasks.inProgress)
    },
    {
      id: 'dockAppointments',
      label: 'Dock Appointments',
      value: kpis.dockAppointments.today,
      icon: Truck,
      color: getKpiColor('dockAppointments', kpis.dockAppointments.today),
      badgeColor: getKpiBadgeColor('dockAppointments', kpis.dockAppointments.today)
    }
  ]

  return (
    <div className="flex space-x-4 overflow-x-auto pb-2">
      {kpiItems.map((kpi) => {
        const IconComponent = kpi.icon
        return (
          <Card 
            key={kpi.id} 
            className="uber-card min-w-[140px] cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onKpiClick?.(kpi.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`h-4 w-4 ${kpi.color}`} />
                <Badge className={`text-xs ${kpi.badgeColor}`}>
                  {kpi.label}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${kpi.color}`}>
                  {formatNumber(kpi.value)}
                </span>
                {getTrendIcon(kpi.value)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}








































































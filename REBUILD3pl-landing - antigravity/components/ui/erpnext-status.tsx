import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface ERPNextStatusProps {
  erpnextStatus?: string
  blueshipStatus: string
  syncedAt?: Date | string
  className?: string
}

export function ERPNextStatus({ 
  erpnextStatus, 
  blueshipStatus, 
  syncedAt,
  className = '' 
}: ERPNextStatusProps) {
  const getSyncIcon = () => {
    if (!erpnextStatus) return <AlertCircle className="h-3 w-3 text-gray-400" />
    if (syncedAt) return <CheckCircle className="h-3 w-3 text-green-600" />
    return <Clock className="h-3 w-3 text-yellow-600" />
  }

  const formatSyncTime = (time: Date | string) => {
    const date = new Date(time)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return `${Math.floor(diffMinutes / 1440)}d ago`
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">BlueShip:</span>
        <Badge variant="default" className="text-xs">
          {blueshipStatus}
        </Badge>
      </div>
      
      {erpnextStatus && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">ERPNext:</span>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
            {erpnextStatus}
          </Badge>
        </div>
      )}
      
      <div className="flex items-center gap-1 text-xs text-gray-500">
        {getSyncIcon()}
        {syncedAt && <span>{formatSyncTime(syncedAt)}</span>}
      </div>
    </div>
  )
}



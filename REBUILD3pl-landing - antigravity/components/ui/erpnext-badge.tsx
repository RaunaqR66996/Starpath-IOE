import { Badge } from '@/components/ui/badge'
import { Link } from 'lucide-react'

interface ERPNextBadgeProps {
  orderNumber?: string
  itemCode?: string
  warehouseCode?: string
  poNumber?: string
  className?: string
}

export function ERPNextBadge({ 
  orderNumber, 
  itemCode, 
  warehouseCode, 
  poNumber,
  className = '' 
}: ERPNextBadgeProps) {
  const displayText = orderNumber || itemCode || warehouseCode || poNumber || 'ERPNext'
  
  return (
    <Badge 
      variant="outline" 
      className={`bg-blue-50 text-blue-700 border-blue-200 ${className}`}
    >
      <Link className="h-3 w-3 mr-1" />
      ERPNext: {displayText}
    </Badge>
  )
}



import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface ERPNextLinkProps {
  doctype: 'sales-order' | 'purchase-order' | 'item' | 'warehouse' | 'delivery-note'
  docname: string
  label?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}

export function ERPNextLink({ 
  doctype, 
  docname, 
  label = 'View in ERPNext',
  variant = 'ghost',
  size = 'sm'
}: ERPNextLinkProps) {
  const erpnextUrl = process.env.NEXT_PUBLIC_ERP_NEXT_URL
  
  if (!erpnextUrl || !docname) return null
  
  const url = `${erpnextUrl}/app/${doctype}/${docname}`
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => window.open(url, '_blank')}
      className="text-xs"
    >
      <ExternalLink className="h-3 w-3 mr-1" />
      {label}
    </Button>
  )
}


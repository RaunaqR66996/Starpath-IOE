"use client"

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { WorkspaceConfig, WorkspaceItem } from '@/lib/workspace/workspace-config'
import { getWorkspaceItemRoute, isSectionBreak, isChildItem, parseWorkspaceItems } from '@/lib/workspace/workspace-config'
import { isActiveRoute } from '@/lib/workspace/navigation'
import {
  Home,
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  Map,
  DollarSign,
  MapPin,
  Building2,
  ArrowDownToLine,
  ClipboardCheck,
  ArrowRight,
  Box,
  Waves,
  Hand,
  Package2,
  Ship,
  Settings,
  ChevronDown,
  ChevronRight,
  Circle,
  NotepadText,
} from 'lucide-react'

// Icon mapping - matches ERPNext icon names to Lucide icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  chart: LayoutDashboard,
  dashboard: LayoutDashboard,
  package: Package,
  'notebook-tabs': FileText,
  customer: Circle,
  receipt: FileText,
  computer: Circle,
  'notepad-text': NotepadText,
  database: Circle,
  settings: Settings,
  truck: Truck,
  warehouse: Building2,
  map: Map,
  dollar: DollarSign,
  route: MapPin,
  default: Circle,
}

interface WorkspaceSidebarProps {
  config: WorkspaceConfig
  className?: string
}

export function WorkspaceSidebar({ config, className }: WorkspaceSidebarProps) {
  const pathname = usePathname()
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const workspaceName = config.name?.toLowerCase() || 'workspace'
  
  const sections = useMemo(() => parseWorkspaceItems(config.items), [config.items])
  
  const toggleSection = (sectionLabel: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionLabel)) {
        next.delete(sectionLabel)
      } else {
        next.add(sectionLabel)
      }
      return next
    })
  }
  
  const getIcon = (item: WorkspaceItem) => {
    const iconName = item.icon || 'default'
    const IconComponent = iconMap[iconName] || iconMap.default
    return IconComponent
  }
  
  const renderItem = (item: WorkspaceItem, index: number, isInSection: boolean = false) => {
    if (isSectionBreak(item)) {
      const isCollapsed = collapsedSections.has(item.label)
      const hasActiveChild = sections
        .flat()
        .some((i) => i.label !== item.label && isChildItem(i) && isActiveRoute(pathname || '', i, workspaceName))
      
      return (
        <div key={`section-${index}`} className="mt-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => toggleSection(item.label)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:bg-gray-50 rounded"
          >
            <span>{item.label}</span>
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      )
    }
    
    // Skip rendering child items if their section is collapsed
    if (isChildItem(item)) {
      const parentSection = sections.find((section) =>
        section.some((i) => i.type === 'Section Break' && section.indexOf(item) > section.indexOf(i))
      )
      if (parentSection) {
        const sectionBreak = parentSection.find((i) => i.type === 'Section Break')
        if (sectionBreak && collapsedSections.has(sectionBreak.label)) {
          return null
        }
      }
    }
    
    const route = getWorkspaceItemRoute(item, workspaceName)
    const isActive = isActiveRoute(pathname || '', item, workspaceName)
    const Icon = getIcon(item)
    const indent = isChildItem(item) ? 'pl-8' : 'pl-3'
    
    if (!route) {
      return null
    }
    
    return (
      <Link
        key={`item-${index}`}
        href={route}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
          indent,
          isActive
            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
            : 'text-gray-700 hover:bg-gray-50',
          isChildItem(item) && 'text-xs'
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
      </Link>
    )
  }
  
  return (
    <div className={cn('w-60 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto', className)}>
      {/* Workspace Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{config.title}</h2>
            <p className="text-xs text-gray-500">{config.module || ''}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Items */}
      <nav className="p-2 space-y-1">
        {config.items.map((item, index) => renderItem(item, index))}
      </nav>
    </div>
  )
}


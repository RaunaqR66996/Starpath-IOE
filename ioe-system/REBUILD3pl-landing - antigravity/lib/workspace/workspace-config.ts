/**
 * Workspace Configuration System
 * Loads and parses ERPNext-style workspace JSON configurations
 */

export type WorkspaceItemType = 'Link' | 'Section Break'
export type LinkType = 'Workspace' | 'DocType' | 'Dashboard' | 'Report' | 'Page'

export interface WorkspaceItem {
  child?: number
  collapsible?: number
  icon?: string
  indent?: number
  keep_closed?: number
  label: string
  link_to?: string
  link_type?: LinkType
  show_arrow?: number
  type: WorkspaceItemType
}

export interface WorkspaceConfig {
  app: string
  doctype: string
  header_icon: string
  title: string
  items: WorkspaceItem[]
  creation?: string
  modified?: string
  module?: string
  name?: string
}

/**
 * Load workspace configuration from JSON file
 */
export async function loadWorkspaceConfig(workspaceName: string): Promise<WorkspaceConfig | null> {
  try {
    // Try to load from app directory (for Next.js app router)
    const configPath = `/app/${workspaceName}/workspace.json`
    
    // In a real implementation, this would fetch from the file system or API
    // For now, we'll return null and let the caller handle it
    // The actual configs will be defined in the workspace JSON files
    
    return null
  } catch (error) {
    console.error(`Failed to load workspace config for ${workspaceName}:`, error)
    return null
  }
}

/**
 * Parse workspace items into a hierarchical structure
 */
export function parseWorkspaceItems(items: WorkspaceItem[]): WorkspaceItem[][] {
  const result: WorkspaceItem[][] = []
  let currentSection: WorkspaceItem[] = []
  
  for (const item of items) {
    if (item.type === 'Section Break') {
      if (currentSection.length > 0) {
        result.push(currentSection)
      }
      currentSection = [item]
    } else {
      currentSection.push(item)
    }
  }
  
  if (currentSection.length > 0) {
    result.push(currentSection)
  }
  
  return result
}

/**
 * Get route path for a workspace item
 */
export function getWorkspaceItemRoute(item: WorkspaceItem, workspaceName: string): string {
  if (!item.link_to) return ''
  
  switch (item.link_type) {
    case 'Workspace':
      return `/${workspaceName}`
    case 'Dashboard':
      return `/${workspaceName}/dashboard`
    case 'DocType':
      // Convert DocType name to route (e.g., "Sales Order" -> "sales-order")
      const route = item.link_to.toLowerCase().replace(/\s+/g, '-')
      return `/${workspaceName}/${route}`
    case 'Report':
      const reportRoute = item.link_to.toLowerCase().replace(/\s+/g, '-')
      return `/${workspaceName}/reports/${reportRoute}`
    case 'Page':
      return item.link_to.startsWith('/') ? item.link_to : `/${item.link_to}`
    default:
      return ''
  }
}

/**
 * Check if a workspace item is a parent section
 */
export function isSectionBreak(item: WorkspaceItem): boolean {
  return item.type === 'Section Break'
}

/**
 * Check if a workspace item is a child item (indented)
 */
export function isChildItem(item: WorkspaceItem): boolean {
  return (item.child ?? 0) > 0 || (item.indent ?? 0) > 0
}

/**
 * Get icon name for workspace item
 */
export function getWorkspaceIcon(item: WorkspaceItem): string {
  return item.icon || 'circle'
}


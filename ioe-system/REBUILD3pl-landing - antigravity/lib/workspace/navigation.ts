/**
 * Navigation Utilities
 * Routing logic for workspace navigation
 */

import type { WorkspaceItem, LinkType } from './workspace-config'
import { getWorkspaceItemRoute } from './workspace-config'

/**
 * Generate route path from workspace item
 */
export function generateRoute(item: WorkspaceItem, workspaceName: string): string {
  return getWorkspaceItemRoute(item, workspaceName)
}

/**
 * Check if current path matches workspace item
 */
export function isActiveRoute(currentPath: string, item: WorkspaceItem, workspaceName: string): boolean {
  const route = generateRoute(item, workspaceName)
  if (!route) return false
  
  // Exact match
  if (currentPath === route) return true
  
  // Child route match (e.g., /tms/shipment/new matches /tms/shipment)
  if (currentPath.startsWith(route + '/')) return true
  
  return false
}

/**
 * Get breadcrumb path for workspace navigation
 */
export function getBreadcrumbs(path: string, workspaceName: string, workspaceTitle: string): Array<{ label: string; href: string }> {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs: Array<{ label: string; href: string }> = [
    { label: 'Home', href: '/' },
  ]
  
  if (segments.length > 0 && segments[0] === workspaceName) {
    breadcrumbs.push({ label: workspaceTitle, href: `/${workspaceName}` })
  }
  
  // Add remaining segments
  let currentPath = ''
  for (let i = 1; i < segments.length; i++) {
    currentPath += `/${segments[i]}`
    const segment = segments[i]
    const label = segment.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    breadcrumbs.push({ label, href: `/${workspaceName}${currentPath}` })
  }
  
  return breadcrumbs
}

/**
 * Parse route parameters from path
 */
export function parseRouteParams(path: string, workspaceName: string): {
  doctype?: string
  id?: string
  mode?: 'list' | 'new' | 'edit' | 'view'
} {
  const segments = path.split('/').filter(Boolean)
  
  if (segments.length < 2 || segments[0] !== workspaceName) {
    return {}
  }
  
  const doctype = segments[1]
  const id = segments[2]
  const mode = id === 'new' ? 'new' : id ? 'edit' : 'list'
  
  return { doctype, id: id && id !== 'new' ? id : undefined, mode }
}

/**
 * Generate URL for DocType action
 */
export function generateDocTypeUrl(
  workspaceName: string,
  doctypeName: string,
  action: 'list' | 'new' | 'edit' | 'view',
  id?: string
): string {
  const routeName = doctypeName.toLowerCase().replace(/\s+/g, '-')
  
  switch (action) {
    case 'list':
      return `/${workspaceName}/${routeName}`
    case 'new':
      return `/${workspaceName}/${routeName}/new`
    case 'edit':
      return `/${workspaceName}/${routeName}/${id}/edit`
    case 'view':
      return `/${workspaceName}/${routeName}/${id}`
    default:
      return `/${workspaceName}/${routeName}`
  }
}


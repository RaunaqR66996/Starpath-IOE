export type RouteRole = 'admin' | 'supervisor' | 'associate' | 'viewer'

interface RoutePolicy {
  pattern: RegExp
  roles: RouteRole[]
}

const DEFAULT_ROLES: RouteRole[] = ['admin', 'supervisor', 'associate', 'viewer']

const ROUTE_POLICIES: RoutePolicy[] = [
  {
    pattern: /^\/api\/auth\//,
    roles: DEFAULT_ROLES
  },
  {
    pattern: /^\/api\/wms\//,
    roles: ['admin', 'supervisor', 'associate']
  },
  {
    pattern: /^\/api\/tms\//,
    roles: ['admin', 'supervisor']
  },
  {
    pattern: /^\/api\/load-optimizer/,
    roles: ['admin', 'supervisor']
  },
  {
    pattern: /^\/api\/planning\//,
    roles: ['admin', 'supervisor']
  }
]

export function resolveRoutePolicy(pathname: string): { roles: RouteRole[] } {
  const policy = ROUTE_POLICIES.find(candidate => candidate.pattern.test(pathname))
  if (policy) {
    return { roles: policy.roles }
  }
  return { roles: DEFAULT_ROLES }
}


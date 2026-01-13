import { ApiError } from '@/lib/api/handler'
import { UserPayload } from '@/lib/auth'

export function requireOrganizationId(user?: UserPayload | null) {
  if (!user?.organizationId) {
    throw new ApiError('organizationId is required', 400)
  }
  return user.organizationId
}


import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiPermission, CreatePermissionPayload } from '@/types/api/rbac'

export function listPermissions(page = 1): Promise<PaginatedEnvelope<ApiPermission>> {
  return apiRequest('/api/v1/permissions', { query: { page, per_page: 100 } })
}

export function createPermission(
  payload: CreatePermissionPayload,
): Promise<ApiEnvelope<ApiPermission>> {
  return apiRequest('/api/v1/permissions', { method: 'POST', body: payload })
}

export function deletePermission(id: number): Promise<void> {
  return apiRequest(`/api/v1/permissions/${id}`, { method: 'DELETE' })
}

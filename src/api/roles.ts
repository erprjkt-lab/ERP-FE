import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiRole,
  CreateRolePayload,
  SyncRolePermissionsPayload,
  UpdateRolePayload,
} from '@/types/api/rbac'

export function listRoles(page = 1): Promise<PaginatedEnvelope<ApiRole>> {
  return apiRequest('/api/v1/roles', { query: { page, per_page: 100 } })
}

export function getRole(id: number): Promise<ApiEnvelope<ApiRole>> {
  return apiRequest(`/api/v1/roles/${id}`)
}

export function createRole(payload: CreateRolePayload): Promise<ApiEnvelope<ApiRole>> {
  return apiRequest('/api/v1/roles', { method: 'POST', body: payload })
}

export function updateRole(id: number, payload: UpdateRolePayload): Promise<ApiEnvelope<ApiRole>> {
  return apiRequest(`/api/v1/roles/${id}`, { method: 'PUT', body: payload })
}

export function syncRolePermissions(
  id: number,
  payload: SyncRolePermissionsPayload,
): Promise<ApiEnvelope<ApiRole>> {
  return apiRequest(`/api/v1/roles/${id}/permissions`, { method: 'POST', body: payload })
}

export function deleteRole(id: number): Promise<void> {
  return apiRequest(`/api/v1/roles/${id}`, { method: 'DELETE' })
}

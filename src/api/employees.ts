import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiEmployeeMenuNode, GrantMenuPermissionsBulkPayload } from '@/types/api/rbac'
import type {
  ApiEmployee,
  CreateEmployeePayload,
  SyncEmployeePermissionsPayload,
  SyncEmployeeRolesPayload,
  UpdateEmployeePayload,
} from '@/types/api/hr'

export function listEmployees(page = 1): Promise<PaginatedEnvelope<ApiEmployee>> {
  return apiRequest('/api/v1/employees', { query: { page, per_page: 100 } })
}

export function getEmployee(id: number): Promise<ApiEnvelope<ApiEmployee>> {
  return apiRequest(`/api/v1/employees/${id}`)
}

export function createEmployee(payload: CreateEmployeePayload): Promise<ApiEnvelope<ApiEmployee>> {
  return apiRequest('/api/v1/employees', { method: 'POST', body: payload })
}

export function updateEmployee(
  id: number,
  payload: UpdateEmployeePayload,
): Promise<ApiEnvelope<ApiEmployee>> {
  return apiRequest(`/api/v1/employees/${id}`, { method: 'PUT', body: payload })
}

export function deleteEmployee(id: number): Promise<void> {
  return apiRequest(`/api/v1/employees/${id}`, { method: 'DELETE' })
}

export function syncEmployeeRoles(
  id: number,
  payload: SyncEmployeeRolesPayload,
): Promise<ApiEnvelope<ApiEmployee>> {
  return apiRequest(`/api/v1/employees/${id}/roles`, { method: 'POST', body: payload })
}

export function syncEmployeePermissions(
  id: number,
  payload: SyncEmployeePermissionsPayload,
): Promise<ApiEnvelope<ApiEmployee>> {
  return apiRequest(`/api/v1/employees/${id}/permissions`, { method: 'POST', body: payload })
}

// Menu tree annotated with this employee's granted actions (GET returns every menu,
// not just the ones they can see).
export function getEmployeeMenus(id: number): Promise<ApiEnvelope<ApiEmployeeMenuNode[]>> {
  return apiRequest(`/api/v1/employees/${id}/menus`)
}

// Sets the granted actions for several menus in one save; the BE diffs each menu
// against what's held and only touches that menu's module.
export function grantEmployeeMenuPermissions(
  id: number,
  payload: GrantMenuPermissionsBulkPayload,
): Promise<ApiEnvelope<unknown>> {
  return apiRequest(`/api/v1/employees/${id}/menus/permissions`, {
    method: 'POST',
    body: payload,
  })
}

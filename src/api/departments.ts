import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiDepartment,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '@/types/api/hr'

export function listDepartments(page = 1): Promise<PaginatedEnvelope<ApiDepartment>> {
  return apiRequest('/api/v1/departments', { query: { page, per_page: 100 } })
}

export function getDepartment(id: number): Promise<ApiEnvelope<ApiDepartment>> {
  return apiRequest(`/api/v1/departments/${id}`)
}

export function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<ApiEnvelope<ApiDepartment>> {
  return apiRequest('/api/v1/departments', { method: 'POST', body: payload })
}

export function updateDepartment(
  id: number,
  payload: UpdateDepartmentPayload,
): Promise<ApiEnvelope<ApiDepartment>> {
  return apiRequest(`/api/v1/departments/${id}`, { method: 'PUT', body: payload })
}

export function deleteDepartment(id: number): Promise<void> {
  return apiRequest(`/api/v1/departments/${id}`, { method: 'DELETE' })
}

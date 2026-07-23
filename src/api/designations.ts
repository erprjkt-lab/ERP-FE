import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiDesignation,
  CreateDesignationPayload,
  UpdateDesignationPayload,
} from '@/types/api/hr'

export function listDesignations(page = 1): Promise<PaginatedEnvelope<ApiDesignation>> {
  return apiRequest('/api/v1/designations', { query: { page, per_page: 100 } })
}

export function getDesignation(id: number): Promise<ApiEnvelope<ApiDesignation>> {
  return apiRequest(`/api/v1/designations/${id}`)
}

export function createDesignation(
  payload: CreateDesignationPayload,
): Promise<ApiEnvelope<ApiDesignation>> {
  return apiRequest('/api/v1/designations', { method: 'POST', body: payload })
}

export function updateDesignation(
  id: number,
  payload: UpdateDesignationPayload,
): Promise<ApiEnvelope<ApiDesignation>> {
  return apiRequest(`/api/v1/designations/${id}`, { method: 'PUT', body: payload })
}

export function deleteDesignation(id: number): Promise<void> {
  return apiRequest(`/api/v1/designations/${id}`, { method: 'DELETE' })
}

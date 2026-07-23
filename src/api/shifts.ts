import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiShift, CreateShiftPayload, UpdateShiftPayload } from '@/types/api/hr'

export function listShifts(page = 1): Promise<PaginatedEnvelope<ApiShift>> {
  return apiRequest('/api/v1/shifts', { query: { page, per_page: 100 } })
}

export function getShift(id: number): Promise<ApiEnvelope<ApiShift>> {
  return apiRequest(`/api/v1/shifts/${id}`)
}

export function createShift(payload: CreateShiftPayload): Promise<ApiEnvelope<ApiShift>> {
  return apiRequest('/api/v1/shifts', { method: 'POST', body: payload })
}

export function updateShift(
  id: number,
  payload: UpdateShiftPayload,
): Promise<ApiEnvelope<ApiShift>> {
  return apiRequest(`/api/v1/shifts/${id}`, { method: 'PUT', body: payload })
}

export function deleteShift(id: number): Promise<void> {
  return apiRequest(`/api/v1/shifts/${id}`, { method: 'DELETE' })
}

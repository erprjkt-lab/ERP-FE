import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiProcess, CreateProcessPayload, UpdateProcessPayload } from '@/types/api/production'

export function listProcesses(): Promise<PaginatedEnvelope<ApiProcess>> {
  return apiRequest('/api/v1/processes', { query: { per_page: 200 } })
}

export function getProcess(id: number): Promise<ApiEnvelope<ApiProcess>> {
  return apiRequest(`/api/v1/processes/${id}`)
}

export function createProcess(payload: CreateProcessPayload): Promise<ApiEnvelope<ApiProcess>> {
  return apiRequest('/api/v1/processes', { method: 'POST', body: payload })
}

export function updateProcess(
  id: number,
  payload: UpdateProcessPayload,
): Promise<ApiEnvelope<ApiProcess>> {
  return apiRequest(`/api/v1/processes/${id}`, { method: 'PUT', body: payload })
}

export function deleteProcess(id: number): Promise<void> {
  return apiRequest(`/api/v1/processes/${id}`, { method: 'DELETE' })
}

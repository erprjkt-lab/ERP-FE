import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiLocation, CreateLocationPayload, UpdateLocationPayload } from '@/types/api/masters'

export function listLocations(page = 1, perPage = 100): Promise<PaginatedEnvelope<ApiLocation>> {
  return apiRequest('/api/v1/locations', { query: { page, per_page: perPage } })
}

export function getLocation(id: number): Promise<ApiEnvelope<ApiLocation>> {
  return apiRequest(`/api/v1/locations/${id}`)
}

export function createLocation(payload: CreateLocationPayload): Promise<ApiEnvelope<ApiLocation>> {
  return apiRequest('/api/v1/locations', { method: 'POST', body: payload })
}

export function updateLocation(
  id: number,
  payload: UpdateLocationPayload,
): Promise<ApiEnvelope<ApiLocation>> {
  return apiRequest(`/api/v1/locations/${id}`, { method: 'PUT', body: payload })
}

// Separate endpoint on purpose: PUT /locations/{id} does not accept is_active.
export function deactivateLocation(id: number): Promise<ApiEnvelope<ApiLocation>> {
  return apiRequest(`/api/v1/locations/${id}/deactivate`, { method: 'PATCH' })
}

export function deleteLocation(id: number): Promise<void> {
  return apiRequest(`/api/v1/locations/${id}`, { method: 'DELETE' })
}

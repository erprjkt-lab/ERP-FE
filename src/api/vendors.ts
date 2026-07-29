import { apiRequest } from '@/api/client'
import type {
  ApiParty,
  CreatePartyPayload,
  LaravelPaginator,
  UpdatePartyPayload,
} from '@/types/api/masters'

export function listVendors(page = 1): Promise<LaravelPaginator<ApiParty>> {
  return apiRequest('/api/v1/vendors', { query: { page, per_page: 100 } })
}

export function getVendor(id: number): Promise<ApiParty> {
  return apiRequest(`/api/v1/vendors/${id}`)
}

export function createVendor(payload: CreatePartyPayload): Promise<ApiParty> {
  return apiRequest('/api/v1/vendors', { method: 'POST', body: payload })
}

export function updateVendor(id: number, payload: UpdatePartyPayload): Promise<ApiParty> {
  return apiRequest(`/api/v1/vendors/${id}`, { method: 'PUT', body: payload })
}

export function deleteVendor(id: number): Promise<void> {
  return apiRequest(`/api/v1/vendors/${id}`, { method: 'DELETE' })
}

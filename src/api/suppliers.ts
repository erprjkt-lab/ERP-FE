import { apiRequest } from '@/api/client'
import type {
  ApiParty,
  CreatePartyPayload,
  LaravelPaginator,
  UpdatePartyPayload,
} from '@/types/api/masters'

export function listSuppliers(page = 1): Promise<LaravelPaginator<ApiParty>> {
  return apiRequest('/api/v1/suppliers', { query: { page, per_page: 100 } })
}

export function getSupplier(id: number): Promise<ApiParty> {
  return apiRequest(`/api/v1/suppliers/${id}`)
}

export function createSupplier(payload: CreatePartyPayload): Promise<ApiParty> {
  return apiRequest('/api/v1/suppliers', { method: 'POST', body: payload })
}

export function updateSupplier(id: number, payload: UpdatePartyPayload): Promise<ApiParty> {
  return apiRequest(`/api/v1/suppliers/${id}`, { method: 'PUT', body: payload })
}

export function deleteSupplier(id: number): Promise<void> {
  return apiRequest(`/api/v1/suppliers/${id}`, { method: 'DELETE' })
}

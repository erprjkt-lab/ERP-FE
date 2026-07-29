import { apiRequest } from '@/api/client'
import type {
  ApiParty,
  CreatePartyPayload,
  LaravelPaginator,
  UpdatePartyPayload,
} from '@/types/api/masters'

export function listCustomers(page = 1): Promise<LaravelPaginator<ApiParty>> {
  return apiRequest('/api/v1/customers', { query: { page, per_page: 100 } })
}

export function getCustomer(id: number): Promise<ApiParty> {
  return apiRequest(`/api/v1/customers/${id}`)
}

export function createCustomer(payload: CreatePartyPayload): Promise<ApiParty> {
  return apiRequest('/api/v1/customers', { method: 'POST', body: payload })
}

export function updateCustomer(id: number, payload: UpdatePartyPayload): Promise<ApiParty> {
  return apiRequest(`/api/v1/customers/${id}`, { method: 'PUT', body: payload })
}

export function deleteCustomer(id: number): Promise<void> {
  return apiRequest(`/api/v1/customers/${id}`, { method: 'DELETE' })
}

import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiParty, CreatePartyPayload, UpdatePartyPayload } from '@/types/api/masters'

export function listCustomers(page = 1): Promise<PaginatedEnvelope<ApiParty>> {
  return apiRequest('/api/v1/customers', { query: { page, per_page: 100 } })
}

export function getCustomer(id: number): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest(`/api/v1/customers/${id}`)
}

export function createCustomer(payload: CreatePartyPayload): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest('/api/v1/customers', { method: 'POST', body: payload })
}

export function updateCustomer(
  id: number,
  payload: UpdatePartyPayload,
): Promise<ApiEnvelope<ApiParty>> {
  return apiRequest(`/api/v1/customers/${id}`, { method: 'PUT', body: payload })
}

export function deleteCustomer(id: number): Promise<void> {
  return apiRequest(`/api/v1/customers/${id}`, { method: 'DELETE' })
}

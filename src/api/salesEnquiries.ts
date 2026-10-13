import { apiRequest } from '@/api/client'
import type { ApiEnvelope, ItemListParams, PaginatedEnvelope } from '@/types/api'
import type {
  ApiSalesEnquiry,
  ApiSalesEnquiryItemRow,
  SalesEnquiryPayload,
} from '@/types/api/sales'

export interface SalesListParams {
  page?: number
  perPage?: number
  status?: string | null
}

export function getSalesEnquiry(id: number): Promise<ApiEnvelope<ApiSalesEnquiry>> {
  return apiRequest(`/api/v1/sales-enquiries/${id}`)
}

export function createSalesEnquiry(
  payload: SalesEnquiryPayload,
): Promise<ApiEnvelope<ApiSalesEnquiry>> {
  return apiRequest('/api/v1/sales-enquiries', { method: 'POST', body: payload })
}

export function updateSalesEnquiry(
  id: number,
  payload: SalesEnquiryPayload,
): Promise<ApiEnvelope<ApiSalesEnquiry>> {
  return apiRequest(`/api/v1/sales-enquiries/${id}`, { method: 'PUT', body: payload })
}

export function deleteSalesEnquiry(id: number): Promise<ApiEnvelope<null>> {
  return apiRequest(`/api/v1/sales-enquiries/${id}`, { method: 'DELETE' })
}

export function closeSalesEnquiry(id: number): Promise<ApiEnvelope<ApiSalesEnquiry>> {
  return apiRequest(`/api/v1/sales-enquiries/${id}/close`, { method: 'POST' })
}

// Flat one-row-per-enquiry-line listing (joined with enquiry, customer, item and UOM).
export function listSalesEnquiryItems(
  params: ItemListParams = {},
): Promise<PaginatedEnvelope<ApiSalesEnquiryItemRow>> {
  return apiRequest('/api/v1/sales-enquiry-items', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
    },
  })
}

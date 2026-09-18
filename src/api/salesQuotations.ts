import { apiDownload, apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiSalesQuotation, SalesQuotationPayload } from '@/types/api/sales'
import type { SalesListParams } from './salesEnquiries'

export function listSalesQuotations(
  params: SalesListParams = {},
): Promise<PaginatedEnvelope<ApiSalesQuotation>> {
  return apiRequest('/api/v1/sales-quotations', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
    },
  })
}

export function getSalesQuotation(id: number): Promise<ApiEnvelope<ApiSalesQuotation>> {
  return apiRequest(`/api/v1/sales-quotations/${id}`)
}

export function createSalesQuotation(
  payload: SalesQuotationPayload,
): Promise<ApiEnvelope<ApiSalesQuotation>> {
  return apiRequest('/api/v1/sales-quotations', { method: 'POST', body: payload })
}

export function createSalesQuotationFromEnquiry(
  enquiryId: number,
  payload: SalesQuotationPayload,
): Promise<ApiEnvelope<ApiSalesQuotation>> {
  return apiRequest(`/api/v1/sales-quotations/from-enquiry/${enquiryId}`, {
    method: 'POST',
    body: payload,
  })
}

export function updateSalesQuotation(
  id: number,
  payload: SalesQuotationPayload,
): Promise<ApiEnvelope<ApiSalesQuotation>> {
  return apiRequest(`/api/v1/sales-quotations/${id}`, { method: 'PUT', body: payload })
}

export function deleteSalesQuotation(id: number): Promise<ApiEnvelope<null>> {
  return apiRequest(`/api/v1/sales-quotations/${id}`, { method: 'DELETE' })
}

export function sendSalesQuotation(id: number): Promise<ApiEnvelope<ApiSalesQuotation>> {
  return apiRequest(`/api/v1/sales-quotations/${id}/send`, { method: 'POST' })
}

export function acceptSalesQuotation(id: number): Promise<ApiEnvelope<ApiSalesQuotation>> {
  return apiRequest(`/api/v1/sales-quotations/${id}/accept`, { method: 'POST' })
}

export function rejectSalesQuotation(
  id: number,
  reason: string | null,
): Promise<ApiEnvelope<ApiSalesQuotation>> {
  return apiRequest(`/api/v1/sales-quotations/${id}/reject`, {
    method: 'POST',
    body: { reason },
  })
}

export function reviseSalesQuotation(id: number): Promise<ApiEnvelope<ApiSalesQuotation>> {
  return apiRequest(`/api/v1/sales-quotations/${id}/revise`, { method: 'POST' })
}

export function downloadSalesQuotationPdf(id: number, quotationNumber: string): Promise<void> {
  return apiDownload(`/api/v1/sales-quotations/${id}/pdf`, `${quotationNumber}.pdf`)
}

import { apiDownload, apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiSalesInvoice,
  SalesInvoiceFromChallanPayload,
  SalesInvoicePayload,
} from '@/types/api/sales'
import type { SalesListParams } from './salesEnquiries'

export function listSalesInvoices(
  params: SalesListParams = {},
): Promise<PaginatedEnvelope<ApiSalesInvoice>> {
  return apiRequest('/api/v1/sales-invoices', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
    },
  })
}

export function getSalesInvoice(id: number): Promise<ApiEnvelope<ApiSalesInvoice>> {
  return apiRequest(`/api/v1/sales-invoices/${id}`)
}

export function createSalesInvoice(
  payload: SalesInvoicePayload,
): Promise<ApiEnvelope<ApiSalesInvoice>> {
  return apiRequest('/api/v1/sales-invoices', { method: 'POST', body: payload })
}

export function createSalesInvoiceFromChallan(
  payload: SalesInvoiceFromChallanPayload,
): Promise<ApiEnvelope<ApiSalesInvoice>> {
  return apiRequest('/api/v1/sales-invoices/from-challan', { method: 'POST', body: payload })
}

export function updateSalesInvoice(
  id: number,
  payload: SalesInvoicePayload,
): Promise<ApiEnvelope<ApiSalesInvoice>> {
  return apiRequest(`/api/v1/sales-invoices/${id}`, { method: 'PUT', body: payload })
}

export function deleteSalesInvoice(id: number): Promise<ApiEnvelope<null>> {
  return apiRequest(`/api/v1/sales-invoices/${id}`, { method: 'DELETE' })
}

export function postSalesInvoice(id: number): Promise<ApiEnvelope<ApiSalesInvoice>> {
  return apiRequest(`/api/v1/sales-invoices/${id}/post`, { method: 'POST' })
}

export function cancelSalesInvoice(id: number): Promise<ApiEnvelope<ApiSalesInvoice>> {
  return apiRequest(`/api/v1/sales-invoices/${id}/cancel`, { method: 'POST' })
}

export function downloadSalesInvoicePdf(id: number, invoiceNumber: string): Promise<void> {
  return apiDownload(`/api/v1/sales-invoices/${id}/pdf`, `${invoiceNumber}.pdf`)
}

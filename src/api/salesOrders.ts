import { apiDownload, apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiSalesOrder,
  SalesOrderFromQuotationPayload,
  SalesOrderPayload,
} from '@/types/api/sales'
import type { SalesListParams } from './salesEnquiries'

export function listSalesOrders(
  params: SalesListParams = {},
): Promise<PaginatedEnvelope<ApiSalesOrder>> {
  return apiRequest('/api/v1/sales-orders', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
    },
  })
}

export function getSalesOrder(id: number): Promise<ApiEnvelope<ApiSalesOrder>> {
  return apiRequest(`/api/v1/sales-orders/${id}`)
}

export function createSalesOrder(payload: SalesOrderPayload): Promise<ApiEnvelope<ApiSalesOrder>> {
  return apiRequest('/api/v1/sales-orders', { method: 'POST', body: payload })
}

export function createSalesOrderFromQuotation(
  quotationId: number,
  payload: SalesOrderFromQuotationPayload,
): Promise<ApiEnvelope<ApiSalesOrder>> {
  return apiRequest(`/api/v1/sales-orders/from-quotation/${quotationId}`, {
    method: 'POST',
    body: payload,
  })
}

export function updateSalesOrder(
  id: number,
  payload: SalesOrderPayload,
): Promise<ApiEnvelope<ApiSalesOrder>> {
  return apiRequest(`/api/v1/sales-orders/${id}`, { method: 'PUT', body: payload })
}

export function deleteSalesOrder(id: number): Promise<ApiEnvelope<null>> {
  return apiRequest(`/api/v1/sales-orders/${id}`, { method: 'DELETE' })
}

export function approveSalesOrder(id: number): Promise<ApiEnvelope<ApiSalesOrder>> {
  return apiRequest(`/api/v1/sales-orders/${id}/approve`, { method: 'POST' })
}

export function cancelSalesOrder(
  id: number,
  reason: string | null,
): Promise<ApiEnvelope<ApiSalesOrder>> {
  return apiRequest(`/api/v1/sales-orders/${id}/cancel`, { method: 'POST', body: { reason } })
}

export function downloadSalesOrderPdf(id: number, orderNumber: string): Promise<void> {
  return apiDownload(`/api/v1/sales-orders/${id}/pdf`, `${orderNumber}.pdf`)
}

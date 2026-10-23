import { apiRequest } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { ApiEnvelope, ItemListParams, PaginatedEnvelope } from '@/types/api'
import type {
  ApiSalesInvoice,
  ApiSalesInvoiceItemRow,
  SalesInvoiceFromChallanPayload,
  SalesInvoicePayload,
} from '@/types/api/sales'

export interface SalesInvoiceListParams {
  page?: number
  perPage?: number
  status?: string | null
  partyId?: string | null
}

export function listSalesInvoices(
  params: SalesInvoiceListParams = {},
): Promise<PaginatedEnvelope<ApiSalesInvoice>> {
  return apiRequest('/api/v1/sales-invoices', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
      ...(params.partyId ? { party_id: params.partyId } : {}),
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

export function postSalesInvoice(id: number): Promise<ApiEnvelope<ApiSalesInvoice>> {
  return apiRequest(`/api/v1/sales-invoices/${id}/post`, { method: 'POST' })
}

export function cancelSalesInvoice(id: number): Promise<ApiEnvelope<ApiSalesInvoice>> {
  return apiRequest(`/api/v1/sales-invoices/${id}/cancel`, { method: 'POST' })
}

export function deleteSalesInvoice(id: number): Promise<ApiEnvelope<null>> {
  return apiRequest(`/api/v1/sales-invoices/${id}`, { method: 'DELETE' })
}

// Binary response, so it can't go through apiRequest — same approach as the
// delivery challan PDF download.
export async function downloadSalesInvoicePdf(id: number, fileName: string): Promise<void> {
  const token = useAuthStore.getState().token
  const base = import.meta.env.VITE_API_BASE_URL
  const response = await fetch(`${base}/api/v1/sales-invoices/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new Error('Failed to download the sales invoice PDF')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// Flat one-row-per-invoice-line listing (joined with invoice, customer, item and UOM).
export function listSalesInvoiceItems(
  params: ItemListParams = {},
): Promise<PaginatedEnvelope<ApiSalesInvoiceItemRow>> {
  return apiRequest('/api/v1/sales-invoice-items', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
    },
  })
}

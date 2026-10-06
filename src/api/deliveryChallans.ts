import { apiRequest } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiDeliveryChallan, DeliveryChallanPayload } from '@/types/api/sales'

export interface DeliveryChallanListParams {
  page?: number
  perPage?: number
  status?: string | null
  partyId?: number | null
  salesOrderId?: number | null
  fromDate?: string | null
  toDate?: string | null
}

export function listDeliveryChallans(
  params: DeliveryChallanListParams = {},
): Promise<PaginatedEnvelope<ApiDeliveryChallan>> {
  return apiRequest('/api/v1/delivery-challans', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
      ...(params.partyId ? { party_id: params.partyId } : {}),
      ...(params.salesOrderId ? { sales_order_id: params.salesOrderId } : {}),
      ...(params.fromDate ? { from_date: params.fromDate } : {}),
      ...(params.toDate ? { to_date: params.toDate } : {}),
    },
  })
}

export function getDeliveryChallan(id: number): Promise<ApiEnvelope<ApiDeliveryChallan>> {
  return apiRequest(`/api/v1/delivery-challans/${id}`)
}

export function createDeliveryChallan(
  payload: DeliveryChallanPayload,
): Promise<ApiEnvelope<ApiDeliveryChallan>> {
  return apiRequest('/api/v1/delivery-challans', { method: 'POST', body: payload })
}

export function getDeliveryChallansForOrder(
  salesOrderId: number,
): Promise<ApiEnvelope<ApiDeliveryChallan[]>> {
  return apiRequest(`/api/v1/sales-orders/${salesOrderId}/delivery-challans`)
}

export function cancelDeliveryChallan(id: number): Promise<ApiEnvelope<ApiDeliveryChallan>> {
  return apiRequest(`/api/v1/delivery-challans/${id}/cancel`, { method: 'POST' })
}

// Binary response, so it can't go through apiRequest — fetch it directly with
// the auth header and hand the browser a blob URL to download.
export async function downloadDeliveryChallanPdf(id: number, fileName: string): Promise<void> {
  const token = useAuthStore.getState().token
  const base = import.meta.env.VITE_API_BASE_URL
  const response = await fetch(`${base}/api/v1/delivery-challans/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new Error('Failed to download the delivery challan PDF')
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

import { apiDownload, apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiDeliveryChallan, DeliveryChallanPayload } from '@/types/api/sales'
import type { SalesListParams } from './salesEnquiries'

export function listDeliveryChallans(
  params: SalesListParams = {},
): Promise<PaginatedEnvelope<ApiDeliveryChallan>> {
  return apiRequest('/api/v1/delivery-challans', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
    },
  })
}

export function getDeliveryChallan(id: number): Promise<ApiEnvelope<ApiDeliveryChallan>> {
  return apiRequest(`/api/v1/delivery-challans/${id}`)
}

export function listChallansForOrder(
  salesOrderId: number,
): Promise<ApiEnvelope<ApiDeliveryChallan[]>> {
  return apiRequest(`/api/v1/sales-orders/${salesOrderId}/delivery-challans`)
}

export function createDeliveryChallan(
  payload: DeliveryChallanPayload,
): Promise<ApiEnvelope<ApiDeliveryChallan>> {
  return apiRequest('/api/v1/delivery-challans', { method: 'POST', body: payload })
}

export function cancelDeliveryChallan(id: number): Promise<ApiEnvelope<ApiDeliveryChallan>> {
  return apiRequest(`/api/v1/delivery-challans/${id}/cancel`, { method: 'POST' })
}

export function downloadDeliveryChallanPdf(id: number, challanNumber: string): Promise<void> {
  return apiDownload(`/api/v1/delivery-challans/${id}/pdf`, `${challanNumber}.pdf`)
}

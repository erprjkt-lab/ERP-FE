import { apiRequest } from '@/api/client'
import type { ApiEnvelope, ItemListParams, PaginatedEnvelope } from '@/types/api'
import type {
  ApiPurchaseEnquiry,
  ApiPurchaseEnquiryItemRow,
  ApiPurchaseOrder,
  ApiQuotationComparisonRow,
  PurchaseEnquiryFromRequisitionsPayload,
  PurchaseEnquiryManualPayload,
  PurchaseEnquiryUpdatePayload,
  SelectSupplierPayload,
} from '@/types/api/procurement'

export function listPurchaseEnquiries(): Promise<PaginatedEnvelope<ApiPurchaseEnquiry>> {
  return apiRequest('/api/v1/purchase-enquiries', { query: { per_page: 100 } })
}

export function getPurchaseEnquiry(id: number): Promise<ApiEnvelope<ApiPurchaseEnquiry>> {
  return apiRequest(`/api/v1/purchase-enquiries/${id}`)
}

export function createPurchaseEnquiryManual(
  payload: PurchaseEnquiryManualPayload,
): Promise<ApiEnvelope<ApiPurchaseEnquiry>> {
  return apiRequest('/api/v1/purchase-enquiries', { method: 'POST', body: payload })
}

export function createPurchaseEnquiryFromRequisitions(
  payload: PurchaseEnquiryFromRequisitionsPayload,
): Promise<ApiEnvelope<ApiPurchaseEnquiry>> {
  return apiRequest('/api/v1/purchase-enquiries/from-requisitions', {
    method: 'POST',
    body: payload,
  })
}

export function updatePurchaseEnquiry(
  id: number,
  payload: PurchaseEnquiryUpdatePayload,
): Promise<ApiEnvelope<ApiPurchaseEnquiry>> {
  return apiRequest(`/api/v1/purchase-enquiries/${id}`, { method: 'PUT', body: payload })
}

export function deletePurchaseEnquiry(id: number): Promise<void> {
  return apiRequest(`/api/v1/purchase-enquiries/${id}`, { method: 'DELETE' })
}

export function getQuotationComparison(
  id: number,
): Promise<ApiEnvelope<ApiQuotationComparisonRow[]>> {
  return apiRequest(`/api/v1/purchase-enquiries/${id}/quotation-comparison`)
}

export function selectSupplierForEnquiry(
  id: number,
  payload: SelectSupplierPayload,
): Promise<ApiEnvelope<ApiPurchaseEnquiry>> {
  return apiRequest(`/api/v1/purchase-enquiries/${id}/select-supplier`, {
    method: 'POST',
    body: payload,
  })
}

export function createPurchaseOrderFromEnquiry(
  id: number,
  force = false,
): Promise<ApiEnvelope<ApiPurchaseOrder>> {
  return apiRequest(`/api/v1/purchase-enquiries/${id}/create-purchase-order`, {
    method: 'POST',
    body: { force },
  })
}

// Flat one-row-per-enquiry-line listing (joined with enquiry, item and UOM).
export function listPurchaseEnquiryItems(
  params: ItemListParams = {},
): Promise<PaginatedEnvelope<ApiPurchaseEnquiryItemRow>> {
  return apiRequest('/api/v1/purchase-enquiry-items', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      ...(params.status ? { status: params.status } : {}),
    },
  })
}

import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type {
  ApiSupplierQuotation,
  SupplierQuotationPayload,
  SupplierQuotationUpdatePayload,
} from '@/types/api/procurement'

export function listQuotationsForEnquiry(
  purchaseEnquiryId: number,
): Promise<ApiEnvelope<ApiSupplierQuotation[]>> {
  return apiRequest(`/api/v1/purchase-enquiries/${purchaseEnquiryId}/quotations`)
}

export function recordSupplierQuotation(
  purchaseEnquiryId: number,
  payload: SupplierQuotationPayload,
): Promise<ApiEnvelope<ApiSupplierQuotation>> {
  return apiRequest(`/api/v1/purchase-enquiries/${purchaseEnquiryId}/quotations`, {
    method: 'POST',
    body: payload,
  })
}

export function getSupplierQuotation(id: number): Promise<ApiEnvelope<ApiSupplierQuotation>> {
  return apiRequest(`/api/v1/quotations/${id}`)
}

export function updateSupplierQuotation(
  id: number,
  payload: SupplierQuotationUpdatePayload,
): Promise<ApiEnvelope<ApiSupplierQuotation>> {
  return apiRequest(`/api/v1/quotations/${id}`, { method: 'PUT', body: payload })
}

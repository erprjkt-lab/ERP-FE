import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { ApiSupplierQuotation, SupplierQuotationPayload } from '@/types/api/procurement'

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

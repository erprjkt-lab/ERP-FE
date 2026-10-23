import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiJobCardChallan, CreateChallanPayload } from '@/types/api/production'

/** Every outsource challan, newest first — ERP-BE's cross-job-card listing.
 *  One challan can bundle items from several job cards; this returns it once. */
export function listChallans(
  params: { page?: number; perPage?: number; status?: number } = {},
): Promise<PaginatedEnvelope<ApiJobCardChallan>> {
  return apiRequest('/api/v1/challans', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 200,
      ...(params.status != null ? { status: params.status } : {}),
    },
  })
}

export function listChallansForJobCard(
  jobCardId: number,
): Promise<ApiEnvelope<ApiJobCardChallan[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/challans`)
}

export function createChallan(
  payload: CreateChallanPayload,
): Promise<ApiEnvelope<ApiJobCardChallan>> {
  return apiRequest('/api/v1/challans', { method: 'POST', body: payload })
}

// Reopens a challan ERP-BE advanced to Received when its last line was
// accepted. ERP-BE allows it only while the challan is
// still RECEIVED (nothing closed against it yet).
export function unmarkChallanReceived(challanId: number): Promise<ApiEnvelope<ApiJobCardChallan>> {
  return apiRequest(`/api/v1/challans/${challanId}/unreceived`, { method: 'PATCH' })
}

export function closeChallan(challanId: number): Promise<ApiEnvelope<ApiJobCardChallan>> {
  return apiRequest(`/api/v1/challans/${challanId}/close`, { method: 'PATCH' })
}

export function deleteChallan(challanId: number): Promise<void> {
  return apiRequest(`/api/v1/challans/${challanId}`, { method: 'DELETE' })
}

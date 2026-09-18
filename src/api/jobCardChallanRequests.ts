import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { ApiJobCardChallanRequest, CreateChallanRequestPayload } from '@/types/api/production'

export function listChallanRequestsForJobCard(
  jobCardId: number,
): Promise<ApiEnvelope<ApiJobCardChallanRequest[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/challan-requests`)
}

export function createChallanRequest(
  jobCardId: number,
  payload: CreateChallanRequestPayload,
): Promise<ApiEnvelope<ApiJobCardChallanRequest>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/challan-requests`, {
    method: 'POST',
    body: payload,
  })
}

export function listPendingChallanRequests(): Promise<ApiEnvelope<ApiJobCardChallanRequest[]>> {
  return apiRequest('/api/v1/challan-requests/pending')
}

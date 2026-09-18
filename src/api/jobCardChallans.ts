import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { ApiJobCardChallan, CreateChallanPayload } from '@/types/api/production'

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

export function markChallanReceived(challanId: number): Promise<ApiEnvelope<ApiJobCardChallan>> {
  return apiRequest(`/api/v1/challans/${challanId}/received`, { method: 'PATCH' })
}

export function closeChallan(challanId: number): Promise<ApiEnvelope<ApiJobCardChallan>> {
  return apiRequest(`/api/v1/challans/${challanId}/close`, { method: 'PATCH' })
}

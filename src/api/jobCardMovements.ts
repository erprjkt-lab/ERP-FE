import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type {
  AcceptMovementPayload,
  ApiJobCardAcceptance,
  ApiJobCardMovement,
  CreateMovementPayload,
} from '@/types/api/production'

export function listMovements(jobCardId: number): Promise<ApiEnvelope<ApiJobCardMovement[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/movements`)
}

export function createMovement(
  jobCardId: number,
  payload: CreateMovementPayload,
): Promise<ApiEnvelope<ApiJobCardMovement>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/movements`, { method: 'POST', body: payload })
}

export function acceptMovement(
  movementId: number,
  payload: AcceptMovementPayload,
): Promise<ApiEnvelope<ApiJobCardAcceptance>> {
  return apiRequest(`/api/v1/movements/${movementId}/accept`, { method: 'POST', body: payload })
}

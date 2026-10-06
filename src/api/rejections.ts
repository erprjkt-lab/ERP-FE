import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiRejection,
  ApiRejectionReason,
  ApiRejectionReview,
  CreateRejectionReviewPayload,
  RejectionReasonPayload,
} from '@/types/api/production'

export function listRejectionsForJobCard(jobCardId: number): Promise<ApiEnvelope<ApiRejection[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/rejections`)
}

export function listPendingRejections(): Promise<ApiEnvelope<ApiRejection[]>> {
  return apiRequest('/api/v1/rejections/pending')
}

export function listRejectionReviews(
  rejectionId: number,
): Promise<ApiEnvelope<ApiRejectionReview[]>> {
  return apiRequest(`/api/v1/rejections/${rejectionId}/reviews`)
}

export function createRejectionReview(
  rejectionId: number,
  payload: CreateRejectionReviewPayload,
): Promise<ApiEnvelope<ApiRejectionReview>> {
  return apiRequest(`/api/v1/rejections/${rejectionId}/reviews`, {
    method: 'POST',
    body: payload,
  })
}

export function approveRejectionReview(
  rejectionReviewId: number,
): Promise<ApiEnvelope<ApiRejectionReview>> {
  return apiRequest(`/api/v1/rejection-reviews/${rejectionReviewId}/approve`, { method: 'POST' })
}

export interface RejectionReasonFilters {
  type?: number
  status?: number
}

export function listRejectionReasons(
  filters: RejectionReasonFilters = {},
): Promise<PaginatedEnvelope<ApiRejectionReason>> {
  return apiRequest('/api/v1/rejection-reasons', { query: { ...filters, per_page: 100 } })
}

export function createRejectionReason(
  payload: RejectionReasonPayload,
): Promise<ApiEnvelope<ApiRejectionReason>> {
  return apiRequest('/api/v1/rejection-reasons', { method: 'POST', body: payload })
}

export function updateRejectionReason(
  id: number,
  payload: Partial<RejectionReasonPayload>,
): Promise<ApiEnvelope<ApiRejectionReason>> {
  return apiRequest(`/api/v1/rejection-reasons/${id}`, { method: 'PUT', body: payload })
}

export function deleteRejectionReason(id: number): Promise<ApiEnvelope<null>> {
  return apiRequest(`/api/v1/rejection-reasons/${id}`, { method: 'DELETE' })
}

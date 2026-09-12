import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiJobCard, CreateJobCardPayload, JobCardFilters } from '@/types/api/production'

export function listJobCards(
  filters: JobCardFilters = {},
  perPage = 200,
): Promise<PaginatedEnvelope<ApiJobCard>> {
  return apiRequest('/api/v1/job-cards', { query: { ...filters, per_page: perPage } })
}

export function getJobCard(id: number): Promise<ApiEnvelope<ApiJobCard>> {
  return apiRequest(`/api/v1/job-cards/${id}`)
}

export function createJobCard(payload: CreateJobCardPayload): Promise<ApiEnvelope<ApiJobCard>> {
  return apiRequest('/api/v1/job-cards', { method: 'POST', body: payload })
}

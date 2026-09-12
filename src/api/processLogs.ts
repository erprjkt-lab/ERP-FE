import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type { ApiProcessLog, CreateProcessLogPayload } from '@/types/api/production'

export function listProcessLogs(
  jobCardId: number,
  perPage = 100,
): Promise<PaginatedEnvelope<ApiProcessLog>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/process-logs`, { query: { per_page: perPage } })
}

export function createProcessLog(
  jobCardId: number,
  payload: CreateProcessLogPayload,
): Promise<ApiEnvelope<ApiProcessLog>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/process-logs`, {
    method: 'POST',
    body: payload,
  })
}

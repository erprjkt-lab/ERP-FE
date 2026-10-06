import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type {
  ApiJobCardBomRequirement,
  ApiMaterialIssue,
  CreateMaterialIssuePayload,
} from '@/types/api/production'

export function listBomRequirements(
  jobCardId: number,
): Promise<ApiEnvelope<ApiJobCardBomRequirement[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/bom-requirements`)
}

export function listMaterialIssues(jobCardId: number): Promise<ApiEnvelope<ApiMaterialIssue[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/material-issues`)
}

// One call creates one MaterialIssue row per batch line, all in the same
// transaction — the response is the array of rows it created, not a single one.
export function createMaterialIssue(
  jobCardId: number,
  payload: CreateMaterialIssuePayload,
): Promise<ApiEnvelope<ApiMaterialIssue[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/material-issues`, {
    method: 'POST',
    body: payload,
  })
}

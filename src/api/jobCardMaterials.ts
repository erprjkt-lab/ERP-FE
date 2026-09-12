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

export function createMaterialIssue(
  jobCardId: number,
  payload: CreateMaterialIssuePayload,
): Promise<ApiEnvelope<ApiMaterialIssue>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/material-issues`, {
    method: 'POST',
    body: payload,
  })
}

import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type {
  ApiJobCardBomRequirement,
  ApiMaterialIssue,
  ApiMaterialReturn,
  ApiMaterialSummaryRow,
  CreateMaterialIssuePayload,
  CreateMaterialReturnPayload,
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

// Unlike bom-requirements, this always returns a row per BOM component with the
// server's own used/pending split — no client-side arithmetic needed.
export function getMaterialSummary(
  jobCardId: number,
): Promise<ApiEnvelope<ApiMaterialSummaryRow[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/bom-requirements/material-summary`)
}

export function deleteMaterialIssue(issueId: number): Promise<void> {
  return apiRequest(`/api/v1/material-issues/${issueId}`, { method: 'DELETE' })
}

export function listMaterialReturns(jobCardId: number): Promise<ApiEnvelope<ApiMaterialReturn[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/material-returns`)
}

// One return per call — one component, one batch/heat lot (unlike an issue,
// which takes an array of batch lines).
export function createMaterialReturn(
  jobCardId: number,
  payload: CreateMaterialReturnPayload,
): Promise<ApiEnvelope<ApiMaterialReturn>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/material-returns`, {
    method: 'POST',
    body: payload,
  })
}

export function deleteMaterialReturn(returnId: number): Promise<void> {
  return apiRequest(`/api/v1/material-returns/${returnId}`, { method: 'DELETE' })
}

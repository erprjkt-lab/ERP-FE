import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type {
  ApiStockIssue,
  DirectIssuePayload,
  IssueAgainstRequisitionPayload,
  StockIssueFilters,
} from '@/types/api/inventory'

export function listStockIssuesForRequisition(
  requisitionId: number,
): Promise<ApiEnvelope<ApiStockIssue[]>> {
  return apiRequest(`/api/v1/stock-requisitions/${requisitionId}/issues`)
}

// One call posts one stock_issues row per line, all in the same transaction
// against the given requisition — the response is the array of rows created.
export function issueAgainstRequisition(
  requisitionId: number,
  payload: IssueAgainstRequisitionPayload,
): Promise<ApiEnvelope<ApiStockIssue[]>> {
  return apiRequest(`/api/v1/stock-requisitions/${requisitionId}/issues`, {
    method: 'POST',
    body: payload,
  })
}

export function listAllStockIssues(
  filters: StockIssueFilters = {},
): Promise<ApiEnvelope<ApiStockIssue[]>> {
  return apiRequest('/api/v1/stock-issues', { query: { ...filters } })
}

export function createDirectStockIssue(
  payload: DirectIssuePayload,
): Promise<ApiEnvelope<ApiStockIssue[]>> {
  return apiRequest('/api/v1/stock-issues', { method: 'POST', body: payload })
}

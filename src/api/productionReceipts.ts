import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { ApiProductionReceipt, CreateProductionReceiptPayload } from '@/types/api/production'

export function listProductionReceipts(
  jobCardId: number,
): Promise<ApiEnvelope<ApiProductionReceipt[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/production-receipts`)
}

// Pulls OK qty logged at the job card's last route step into store. ERP-BE used
// to do this automatically when the log was written; it is now an explicit
// action, so the qty sits as ready-to-move until this is called.
export function receiveProduction(
  jobCardId: number,
  payload: CreateProductionReceiptPayload,
): Promise<ApiEnvelope<ApiProductionReceipt>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/production-receipts`, {
    method: 'POST',
    body: payload,
  })
}

export function deleteProductionReceipt(receiptId: number): Promise<void> {
  return apiRequest(`/api/v1/production-receipts/${receiptId}`, { method: 'DELETE' })
}

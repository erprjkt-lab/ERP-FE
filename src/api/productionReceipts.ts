import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { ApiProductionReceipt } from '@/types/api/production'

// Receipts are written by ERP-BE as a side effect of a movement out of the last
// route step (POST /job-cards/{id}/movements with no to_process_id), and reversed
// by deleting that movement — there is no write endpoint of their own.
export function listProductionReceipts(
  jobCardId: number,
): Promise<ApiEnvelope<ApiProductionReceipt[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/production-receipts`)
}

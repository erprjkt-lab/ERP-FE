import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProcessLog, deleteProcessLog, listProcessLogs } from '@/api/processLogs'
import type { ApiProcessLog, CreateProcessLogPayload } from '@/types/api/production'
import type { ProcessLog } from '@/types/production'

function toProcessLog(api: ApiProcessLog): ProcessLog {
  return {
    id: String(api.id),
    processId: String(api.process_id),
    processName: api.process_name ?? '',
    performedByType: api.performed_by_type === 2 ? 'outsourced' : 'in_house',
    processorName: api.processor_employee_name ?? api.processor_party_name ?? '',
    operatorName: api.operator_name ?? '',
    shiftName: api.shift_name ?? '',
    logDate: api.log_date ?? '',
    okQty: Number(api.ok_qty),
    rejectedQty: Number(api.rejected_qty),
    bypassedQty: Number(api.bypassed_qty),
    inboundChallanItemId:
      api.inbound_challan_item_id != null ? String(api.inbound_challan_item_id) : undefined,
    inboundReworkReviewId:
      api.inbound_rework_review_id != null ? String(api.inbound_rework_review_id) : undefined,
    // ERP-BE persists is_rework on the row itself now: a later hop of a redo
    // carries the flag but no review id, so deriving it from the id would drop
    // those logs back into the regular bucket.
    isRework: api.is_rework,
    remark: api.remark ?? undefined,
  }
}

export function useProcessLogs(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'processLogs', jobCardId],
    queryFn: async () => (await listProcessLogs(Number(jobCardId))).data.map(toProcessLog),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

/**
 * Writing or reversing a log touches far more than the log list: it can flip the
 * card draft -> in progress and move current_process_id, post or reverse
 * finished-goods stock, change the received qty on an outsource challan and the
 * consumed qty on its request, and — because ERP-BE derives used_qty from what
 * was logged at the first route step — shift the material summary's used and
 * returnable figures. A log with rejected_qty raises a rejection row, and
 * deleting the log deletes it again, so the rejection lists move too. Create and
 * delete move the same things in opposite directions, so they share one list.
 */
function useProcessLogInvalidation(jobCardId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['production', 'processLogs', jobCardId] })
    queryClient.invalidateQueries({ queryKey: ['production', 'materialSummary', jobCardId] })
    queryClient.invalidateQueries({ queryKey: ['production', 'challans'] })
    queryClient.invalidateQueries({ queryKey: ['production', 'challanRequests'] })
    queryClient.invalidateQueries({ queryKey: ['production', 'jobCards'] })
    queryClient.invalidateQueries({ queryKey: ['rejections'] })
    queryClient.invalidateQueries({ queryKey: ['rejection-reviews'] })
    queryClient.invalidateQueries({ queryKey: ['stock-balance'] })
    queryClient.invalidateQueries({ queryKey: ['stock-ledger'] })
  }
}

export function useCreateProcessLog(jobCardId: string | undefined) {
  const invalidate = useProcessLogInvalidation(jobCardId)
  return useMutation({
    mutationFn: (payload: CreateProcessLogPayload) => createProcessLog(Number(jobCardId), payload),
    onSuccess: invalidate,
  })
}

export function useDeleteProcessLog(jobCardId: string | undefined) {
  const invalidate = useProcessLogInvalidation(jobCardId)
  return useMutation({
    mutationFn: (processLogId: string) => deleteProcessLog(Number(processLogId)),
    onSuccess: invalidate,
  })
}

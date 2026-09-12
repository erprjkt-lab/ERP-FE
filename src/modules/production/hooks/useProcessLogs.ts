import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProcessLog, listProcessLogs } from '@/api/processLogs'
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

export function useCreateProcessLog(jobCardId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProcessLogPayload) => createProcessLog(Number(jobCardId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'processLogs', jobCardId] })
      // A log can flip the card draft -> in progress, move current_process_id,
      // and (at the last step) post finished-goods stock.
      queryClient.invalidateQueries({ queryKey: ['production', 'jobCards'] })
    },
  })
}

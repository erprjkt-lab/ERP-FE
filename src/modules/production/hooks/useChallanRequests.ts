import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createChallanRequest,
  deleteChallanRequest,
  listChallanRequestsForJobCard,
  listPendingChallanRequests,
} from '@/api/jobCardChallanRequests'
import type { ApiJobCardChallanRequest, CreateChallanRequestPayload } from '@/types/api/production'
import type { ChallanRequest } from '@/types/production'

function toChallanRequest(api: ApiJobCardChallanRequest): ChallanRequest {
  return {
    id: String(api.id),
    jobCardId: String(api.job_card_id),
    processId: String(api.process_id),
    processName: api.process_name ?? '',
    requestedQty: Number(api.requested_qty),
    dispatchedQty: Number(api.dispatched_qty),
    consumedQty: Number(api.consumed_qty),
    pendingQty: Number(api.pending_qty),
    status: api.status === 1 ? 'fulfilled' : 'pending',
    requestedByName: api.requested_by_name ?? undefined,
    requestedAt: api.requested_at ?? undefined,
  }
}

export function useChallanRequestsForJobCard(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'challanRequests', 'byJobCard', jobCardId],
    queryFn: async () =>
      (await listChallanRequestsForJobCard(Number(jobCardId))).data.map(toChallanRequest),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function usePendingChallanRequests() {
  const query = useQuery({
    queryKey: ['production', 'challanRequests', 'pending'],
    queryFn: async () => (await listPendingChallanRequests()).data.map(toChallanRequest),
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useCreateChallanRequest(jobCardId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateChallanRequestPayload) =>
      createChallanRequest(Number(jobCardId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['production', 'challanRequests', 'byJobCard', jobCardId],
      })
      queryClient.invalidateQueries({ queryKey: ['production', 'challanRequests', 'pending'] })
    },
  })
}

export function useDeleteChallanRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => deleteChallanRequest(Number(requestId)),
    // Invalidates both the per-job-card and the pending lists; the caller may be
    // on either one.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'challanRequests'] }),
  })
}

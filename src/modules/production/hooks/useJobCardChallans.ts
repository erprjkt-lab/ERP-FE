import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeChallan,
  createChallan,
  deleteChallan,
  listChallans,
  listChallansForJobCard,
  unmarkChallanReceived,
} from '@/api/jobCardChallans'
import type {
  ApiJobCardChallan,
  ApiJobCardChallanItem,
  CreateChallanPayload,
} from '@/types/api/production'
import type { Challan, ChallanItem, ChallanStatus } from '@/types/production'

const STATUS_BY_CODE: Record<number, ChallanStatus> = {
  0: 'open',
  1: 'received',
  2: 'closed',
}

function toChallanItem(api: ApiJobCardChallanItem): ChallanItem {
  return {
    id: String(api.id),
    challanId: String(api.challan_id),
    challanRequestId: String(api.challan_request_id),
    jobCardId: String(api.job_card_id),
    isRework: api.is_rework ?? false,
    processId: String(api.process_id),
    processName: api.process_name ?? '',
    dispatchedQty: Number(api.dispatched_qty),
    receivedQty: Number(api.received_qty),
    outstandingQty: Number(api.outstanding_qty),
    rate: api.rate != null ? Number(api.rate) : undefined,
    amount: api.amount != null ? Number(api.amount) : undefined,
  }
}

function toChallan(api: ApiJobCardChallan): Challan {
  return {
    id: String(api.id),
    challanNumber: api.challan_number,
    challanDate: api.challan_date ?? '',
    destinationPartyId: String(api.destination_party_id),
    destinationPartyName: api.destination_party_name ?? '',
    status: STATUS_BY_CODE[api.status] ?? 'open',
    items: (api.items ?? []).map(toChallanItem),
  }
}

export function useChallansForJobCard(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'challans', 'byJobCard', jobCardId],
    queryFn: async () => (await listChallansForJobCard(Number(jobCardId))).data.map(toChallan),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

// The Outsource list filters and counts by status across the whole set, so it
// takes one wide page rather than server-side paging. ERP-BE returns each
// challan once, however many job cards its items span.
export function useAllChallans() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['production', 'challans', 'all'],
    queryFn: async () => (await listChallans()).data.map(toChallan),
  })

  const refetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ['production', 'challans'] })
  }

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch,
  }
}

export function useCreateChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateChallanPayload) => createChallan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'challans'] })
      queryClient.invalidateQueries({ queryKey: ['production', 'challanRequests'] })
    },
  })
}

export function useUnmarkChallanReceived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challanId: string) => unmarkChallanReceived(Number(challanId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'challans'] }),
  })
}

export function useCloseChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challanId: string) => closeChallan(Number(challanId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'challans'] }),
  })
}

// Deleting an open challan hands its dispatched qty back to the requests it was
// built from, so the pending-request list has to be refetched too.
export function useDeleteChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challanId: string) => deleteChallan(Number(challanId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'challans'] })
      queryClient.invalidateQueries({ queryKey: ['production', 'challanRequests'] })
    },
  })
}

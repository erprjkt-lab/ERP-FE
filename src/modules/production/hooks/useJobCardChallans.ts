import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeChallan,
  createChallan,
  listChallansForJobCard,
  markChallanReceived,
} from '@/api/jobCardChallans'
import type {
  ApiJobCardChallan,
  ApiJobCardChallanItem,
  CreateChallanPayload,
} from '@/types/api/production'
import type { Challan, ChallanItem, ChallanStatus } from '@/types/production'
import { useJobCards } from './useJobCards'

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

// There is no `GET /challans` endpoint on the backend — only
// `GET /job-cards/{id}/challans` — so a cross-job-card view has to fan out
// across every job card and de-duplicate (one challan can bundle items from
// several job cards, so it would otherwise appear once per job card it
// touches). This is real data from real endpoints, just N requests instead
// of one; a global list endpoint on the backend would make this cheaper.
export function useAllChallans() {
  const { data: jobCards, isLoading: jobCardsLoading } = useJobCards()

  const results = useQueries({
    queries: jobCards.map(jobCard => ({
      queryKey: ['production', 'challans', 'byJobCard', jobCard.id],
      queryFn: async () => (await listChallansForJobCard(Number(jobCard.id))).data.map(toChallan),
      enabled: !jobCardsLoading,
    })),
  })

  const isLoading = jobCardsLoading || results.some(r => r.isLoading)
  const byId = new Map<string, Challan>()
  for (const result of results) {
    for (const challan of result.data ?? []) {
      byId.set(challan.id, challan)
    }
  }

  return { data: Array.from(byId.values()), isLoading }
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

export function useMarkChallanReceived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (challanId: string) => markChallanReceived(Number(challanId)),
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

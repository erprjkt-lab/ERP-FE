import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createJobCard, getJobCard, listJobCards } from '@/api/jobCards'
import type { ApiJobCard, CreateJobCardPayload, JobCardFilters } from '@/types/api/production'
import type { JobCard, JobCardStatus, ManufacturingRoute } from '@/types/production'

const STATUS_BY_CODE: Record<number, JobCardStatus> = {
  0: 'draft',
  1: 'in_progress',
  2: 'on_hold',
  3: 'completed',
  4: 'closed',
}

export const JOB_CARD_STATUS_CODE: Record<JobCardStatus, number> = {
  draft: 0,
  in_progress: 1,
  on_hold: 2,
  completed: 3,
  closed: 4,
}

const ROUTE_BY_CODE: Record<number, ManufacturingRoute> = {
  1: 'standard',
  2: 'rework',
  3: 'sample',
}

export const MANUFACTURING_ROUTE_CODE: Record<ManufacturingRoute, number> = {
  standard: 1,
  rework: 2,
  sample: 3,
}

function toJobCard(api: ApiJobCard): JobCard {
  return {
    id: String(api.id),
    jobCardNumber: api.job_card_number,
    jobCardDate: api.job_card_date ?? '',
    targetDate: api.target_date ?? '',
    partyId: api.party_id ? String(api.party_id) : undefined,
    partyName: api.party_name ?? undefined,
    itemId: String(api.item_id),
    itemName: api.item_name ?? '',
    itemRevision: api.item_revision ?? undefined,
    orderedQty: Number(api.ordered_qty),
    manufacturingRoute: ROUTE_BY_CODE[api.manufacturing_route] ?? 'standard',
    outputLocationId: String(api.output_location_id),
    outputLocationName: api.output_location_name ?? undefined,
    currentProcessId: api.current_process_id ? String(api.current_process_id) : undefined,
    currentProcessName: api.current_process_name ?? undefined,
    status: STATUS_BY_CODE[api.status] ?? 'draft',
    remark: api.remark ?? undefined,
    routes: (api.routes ?? [])
      .map(step => ({
        id: String(step.id),
        processId: String(step.process_id),
        processName: step.process_name ?? '',
        sequenceNo: step.sequence_no,
      }))
      .sort((a, b) => a.sequenceNo - b.sequenceNo),
  }
}

export function useJobCards(filters: JobCardFilters = {}) {
  const query = useQuery({
    queryKey: ['production', 'jobCards', filters],
    queryFn: async () => (await listJobCards(filters)).data.map(toJobCard),
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useJobCard(id: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'jobCards', id],
    queryFn: async () => toJobCard((await getJobCard(Number(id))).data),
    enabled: !!id,
  })
  return { ...query, data: query.data, isLoading: query.isLoading }
}

export function useCreateJobCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateJobCardPayload) => createJobCard(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'jobCards'] }),
  })
}

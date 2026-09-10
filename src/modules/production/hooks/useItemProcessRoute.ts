import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  defineItemProcessRoute,
  deleteItemProcessRoute,
  getItemProcessRoute,
} from '@/api/itemProcessRoutes'
import type { ApiItemProcessRouteStep, ItemProcessRouteStepInput } from '@/types/api/production'
import type { ItemProcessRouteStep } from '@/types/production'

function toStep(api: ApiItemProcessRouteStep): ItemProcessRouteStep {
  return {
    id: String(api.id),
    processId: String(api.process_id),
    processName: api.process_name ?? '',
    sequenceNo: api.sequence_no,
    cycleTimeSeconds: api.cycle_time_seconds ?? undefined,
    isOptional: api.is_optional,
  }
}

export function useItemProcessRoute(itemId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'itemProcessRoute', itemId],
    queryFn: async () => (await getItemProcessRoute(Number(itemId))).data.map(toStep),
    enabled: !!itemId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useDefineItemProcessRoute(itemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (steps: ItemProcessRouteStepInput[]) =>
      defineItemProcessRoute(Number(itemId), steps),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['production', 'itemProcessRoute', itemId] }),
  })
}

export function useDeleteItemProcessRoute(itemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteItemProcessRoute(Number(itemId)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['production', 'itemProcessRoute', itemId] }),
  })
}

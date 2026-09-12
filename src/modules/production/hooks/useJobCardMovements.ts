import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { acceptMovement, createMovement, listMovements } from '@/api/jobCardMovements'
import type {
  AcceptMovementPayload,
  ApiJobCardMovement,
  CreateMovementPayload,
} from '@/types/api/production'
import type { JobCardMovement } from '@/types/production'

function toMovement(api: ApiJobCardMovement): JobCardMovement {
  return {
    id: String(api.id),
    fromProcessId: String(api.from_process_id),
    fromProcessName: api.from_process_name ?? '',
    toProcessId: String(api.to_process_id),
    toProcessName: api.to_process_name ?? '',
    movedQty: Number(api.moved_qty),
    movedAt: api.moved_at ?? '',
    acceptances: (api.acceptances ?? []).map(acceptance => ({
      id: String(acceptance.id),
      movementId: String(acceptance.movement_id),
      acceptedQty: Number(acceptance.accepted_qty),
      shortQty: Number(acceptance.short_qty),
      acceptedAt: acceptance.accepted_at ?? '',
    })),
  }
}

export function useJobCardMovements(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'movements', jobCardId],
    queryFn: async () => (await listMovements(Number(jobCardId))).data.map(toMovement),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

function useMovementInvalidation(jobCardId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['production', 'movements', jobCardId] })
    queryClient.invalidateQueries({ queryKey: ['production', 'jobCards'] })
  }
}

export function useCreateMovement(jobCardId: string | undefined) {
  const invalidate = useMovementInvalidation(jobCardId)
  return useMutation({
    mutationFn: (payload: CreateMovementPayload) => createMovement(Number(jobCardId), payload),
    onSuccess: invalidate,
  })
}

export function useAcceptMovement(jobCardId: string | undefined) {
  const invalidate = useMovementInvalidation(jobCardId)
  return useMutation({
    mutationFn: ({ movementId, payload }: { movementId: string; payload: AcceptMovementPayload }) =>
      acceptMovement(Number(movementId), payload),
    onSuccess: invalidate,
  })
}

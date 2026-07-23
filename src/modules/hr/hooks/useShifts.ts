import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createShift, deleteShift, listShifts, updateShift } from '@/api/shifts'
import type { ApiShift, CreateShiftPayload, UpdateShiftPayload } from '@/types/api/hr'
import type { Shift } from '@/types/hr'

function toShift(api: ApiShift): Shift {
  return {
    id: String(api.id),
    name: api.shift_name,
    startTime: api.shift_start,
    endTime: api.shift_end,
    lunchStartTime: api.lunch_start,
    lunchEndTime: api.lunch_end,
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

export function useShifts() {
  return useQuery({
    queryKey: ['shifts'],
    queryFn: async () => (await listShifts()).data.map(toShift),
  })
}

export function useCreateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateShiftPayload) => createShift(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}

export function useUpdateShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateShiftPayload }) =>
      updateShift(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}

export function useDeleteShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteShift(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}

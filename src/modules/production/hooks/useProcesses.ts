import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProcess, deleteProcess, listProcesses, updateProcess } from '@/api/processes'
import type { ApiProcess, CreateProcessPayload, UpdateProcessPayload } from '@/types/api/production'
import type { Process } from '@/types/production'

function toProcess(api: ApiProcess): Process {
  return {
    id: String(api.id),
    processName: api.process_name,
    processCode: api.process_code ?? undefined,
    cycleTime: api.cycle_time ?? undefined,
    status: api.status === 0 ? 'inactive' : 'active',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

export function useProcesses() {
  const query = useQuery({
    queryKey: ['production', 'processes'],
    queryFn: async () => (await listProcesses()).data.map(toProcess),
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useCreateProcess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProcessPayload) => createProcess(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'processes'] }),
  })
}

export function useUpdateProcess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProcessPayload }) =>
      updateProcess(Number(id), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'processes'] }),
  })
}

export function useDeleteProcess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProcess(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'processes'] }),
  })
}

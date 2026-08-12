import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createHsnCode, deleteHsnCode, listHsnCodes, updateHsnCode } from '@/api/hsnCodes'
import type { ApiHsnCode, CreateHsnCodePayload, UpdateHsnCodePayload } from '@/types/api/masters'
import type { HsnCode } from '@/types/masters'

function toHsnCode(api: ApiHsnCode): HsnCode {
  return {
    id: String(api.id),
    hsn: api.hsn,
    description: api.description ?? undefined,
    gstRate: api.gst_rate ?? undefined,
    cgstRate: api.cgst_rate ?? undefined,
    sgstRate: api.sgst_rate ?? undefined,
    igstRate: api.igst_rate ?? undefined,
    cessRate: api.cess_rate ?? undefined,
    status: api.status === 0 ? 'inactive' : 'active',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

export function useHsnCodes() {
  const query = useQuery({
    queryKey: ['masters', 'hsnCodes'],
    queryFn: async () => (await listHsnCodes()).data.map(toHsnCode),
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useCreateHsnCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateHsnCodePayload) => createHsnCode(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'hsnCodes'] }),
  })
}

export function useUpdateHsnCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateHsnCodePayload }) =>
      updateHsnCode(Number(id), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'hsnCodes'] }),
  })
}

export function useDeleteHsnCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteHsnCode(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'hsnCodes'] }),
  })
}

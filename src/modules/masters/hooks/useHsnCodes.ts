import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

/** Defaults match the old single fetch, so the dropdowns that call this with no
 *  arguments are unaffected; the master page passes its own page/size. */
export function useHsnCodes(page = 1, perPage = 200) {
  const query = useQuery({
    queryKey: ['masters', 'hsnCodes', page, perPage],
    queryFn: () => listHsnCodes(page, perPage),
    placeholderData: keepPreviousData,
  })
  return {
    ...query,
    data: query.data?.data.map(toHsnCode) ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
  }
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

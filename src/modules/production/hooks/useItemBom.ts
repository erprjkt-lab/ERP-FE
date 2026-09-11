import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createItemBomLine, deleteItemBomLine, listItemBom, updateItemBomLine } from '@/api/itemBom'
import { useUoms } from '@/modules/masters/hooks/useUoms'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type {
  ApiItemBomLine,
  CreateItemBomLinePayload,
  UpdateItemBomLinePayload,
} from '@/types/api/production'
import type { ItemBomLine } from '@/types/production'

function toBomLine(
  api: ApiItemBomLine,
  componentsById: Map<string, string>,
  uomsById: Map<string, string>,
): ItemBomLine {
  const componentItemId = String(api.component_item_id)
  const uomId = String(api.uom_id)
  return {
    id: String(api.id),
    componentItemId,
    componentName: api.component_name ?? componentsById.get(componentItemId) ?? '',
    quantityPerUnit: Number(api.quantity_per_unit),
    uomId,
    uomName: uomsById.get(uomId) ?? '',
    scrapAllowancePercent:
      api.scrap_allowance_percent != null ? Number(api.scrap_allowance_percent) : undefined,
    status: api.status === 0 ? 'inactive' : 'active',
  }
}

export function useItemBom(itemId: string | undefined) {
  const { data: components = [] } = useProcurementItems()
  const { data: uoms = [] } = useUoms()
  const componentsById = new Map(components.map(c => [c.id, `${c.code} · ${c.name}`]))
  const uomsById = new Map(uoms.map(u => [String(u.id), u.name]))

  const query = useQuery({
    queryKey: ['production', 'itemBom', itemId],
    queryFn: async () => (await listItemBom(Number(itemId))).data,
    enabled: !!itemId,
  })

  const data = (query.data ?? []).map(api => toBomLine(api, componentsById, uomsById))

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateItemBomLine(itemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateItemBomLinePayload) => createItemBomLine(Number(itemId), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'itemBom', itemId] }),
  })
}

export function useUpdateItemBomLine(itemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemBomLinePayload }) =>
      updateItemBomLine(Number(id), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'itemBom', itemId] }),
  })
}

export function useDeleteItemBomLine(itemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteItemBomLine(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['production', 'itemBom', itemId] }),
  })
}

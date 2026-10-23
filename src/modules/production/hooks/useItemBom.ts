import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createItemBomLine, deleteItemBomLine, listItemBom, updateItemBomLine } from '@/api/itemBom'
import { useUoms } from '@/modules/masters/hooks/useUoms'
import type {
  ApiItemBomLine,
  CreateItemBomLinePayload,
  UpdateItemBomLinePayload,
} from '@/types/api/production'
import type { ItemBomLine } from '@/types/production'

function toBomLine(api: ApiItemBomLine, uomsById: Map<string, string>): ItemBomLine {
  const componentItemId = String(api.component_item_id)
  const uomId = String(api.uom_id)
  return {
    id: String(api.id),
    componentItemId,
    componentName: api.component_name ?? '',
    quantityPerUnit: Number(api.quantity_per_unit),
    uomId,
    uomName: uomsById.get(uomId) ?? '',
    scrapAllowancePercent:
      api.scrap_allowance_percent != null ? Number(api.scrap_allowance_percent) : undefined,
    status: api.status === 0 ? 'inactive' : 'active',
  }
}

// ItemBomRepository eager-loads `component`, so ItemBomResource always sends
// component_name; resolving it client-side meant pulling all three item-master
// lists (finished goods + raw materials + consumables) on every page that shows
// a BOM, for a value that was never read. UOM still needs a lookup — the
// resource sends uom_id only.
export function useItemBom(itemId: string | undefined, withUomNames = true) {
  // Callers that render no UOM column skip the UOM master fetch entirely.
  const { data: uoms = [] } = useUoms(1, 200, withUomNames)
  const uomsById = new Map(uoms.map(u => [String(u.id), u.name]))

  const query = useQuery({
    queryKey: ['production', 'itemBom', itemId],
    queryFn: async () => (await listItemBom(Number(itemId))).data,
    enabled: !!itemId,
  })

  const data = (query.data ?? []).map(api => toBomLine(api, uomsById))

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

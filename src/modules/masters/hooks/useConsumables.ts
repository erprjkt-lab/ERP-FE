import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consumablesApi } from '@/api/items'
import type { ApiItemCategory, ApiItemMaster, ApiUom } from '@/types/api/masters'
import type { Consumable } from '@/types/masters'
import type { ConsumableInput } from '../store/mastersStore'
import { useItemCategories } from './useItemCategories'
import { useUoms } from './useUoms'

function idOrNull(id: number | null): string | null {
  return id ? String(id) : null
}

function toConsumable(
  api: ApiItemMaster,
  categoriesById: Map<string, ApiItemCategory>,
  uomsById: Map<string, ApiUom>,
): Consumable {
  const categoryId = idOrNull(api.category_id)
  const uomId = idOrNull(api.uom_id)
  const alternateUomId = idOrNull(api.alternate_uom_id)
  return {
    id: String(api.id),
    code: api.item_code,
    name: api.item_name,
    categoryId,
    category: categoryId ? (categoriesById.get(categoryId)?.name ?? '') : '',
    uomId,
    uom: uomId ? (uomsById.get(uomId)?.name ?? '') : '',
    alternateUomId,
    alternateUom: alternateUomId ? uomsById.get(alternateUomId)?.name : undefined,
    hsnCode: api.hsn_code ?? undefined,
    gstPercent: api.gst_percent ?? undefined,
    description: api.description ?? undefined,
    status: api.status === 0 ? 'inactive' : 'active',
    imageUrl: api.image ?? undefined,
    price: api.price ?? undefined,
    batchTracking: api.batch_tracking,
    heatTracking: api.heat_tracking,
    serialTracking: api.serial_tracking,
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function toPayload(input: Partial<ConsumableInput>) {
  return {
    item_name: input.name,
    category_id: input.categoryId ? Number(input.categoryId) : null,
    uom_id: input.uomId ? Number(input.uomId) : null,
    alternate_uom_id: input.alternateUomId ? Number(input.alternateUomId) : null,
    hsn_code: input.hsnCode,
    gst_percent: input.gstPercent,
    description: input.description,
    status: input.status === 'inactive' ? 0 : 1,
    batch_tracking: input.batchTracking,
    heat_tracking: input.heatTracking,
    serial_tracking: input.serialTracking,
    price: input.price,
  }
}

function useLookupMaps(enabled: boolean) {
  const { data: categories } = useItemCategories(1, 200, enabled)
  const { data: uoms } = useUoms(1, 200, enabled)
  return {
    categoriesById: new Map(categories.map(c => [String(c.id), c])),
    uomsById: new Map(uoms.map(u => [String(u.id), u])),
  }
}

/** `withNames` resolves category/uom/material-grade ids to names, which costs a
 *  fetch of each of those masters. A picker that shows only code and name
 *  passes false and skips all of them. */
export function useConsumables(page = 1, perPage = 100, withNames = true) {
  const { categoriesById, uomsById } = useLookupMaps(withNames)
  const query = useQuery({
    queryKey: ['consumables', page, perPage],
    queryFn: () => consumablesApi.list(page, perPage),
    placeholderData: keepPreviousData,
  })

  const data = query.data?.data.map(api => toConsumable(api, categoriesById, uomsById))

  return { ...query, data, meta: query.data?.meta, isLoading: query.isLoading }
}

export function useCreateConsumable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ConsumableInput) => {
      return await consumablesApi.create(toPayload(input))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consumables'] }),
  })
}

export function useUpdateConsumable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ConsumableInput> }) => {
      return await consumablesApi.update(Number(id), toPayload(payload))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consumables'] }),
  })
}

export function useDeleteConsumable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => consumablesApi.remove(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consumables'] }),
  })
}

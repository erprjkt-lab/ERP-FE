import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consumablesApi } from '@/api/items'
import type { ApiItemCategory, ApiItemMaster, ApiUom } from '@/types/api/masters'
import type { Consumable } from '@/types/masters'
import { useMastersLocalStore } from '../store/mastersLocalStore'
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
  imageUrl: string | undefined,
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
    imageUrl,
    price: api.price ?? undefined,
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
    price: input.price,
  }
}

function useLookupMaps() {
  const { data: categories } = useItemCategories()
  const { data: uoms } = useUoms()
  return {
    categoriesById: new Map(categories.map(c => [String(c.id), c])),
    uomsById: new Map(uoms.map(u => [String(u.id), u])),
  }
}

export function useConsumables() {
  const { categoriesById, uomsById } = useLookupMaps()
  const itemImages = useMastersLocalStore(s => s.itemImages)
  const query = useQuery({
    queryKey: ['consumables'],
    queryFn: async () => (await consumablesApi.list()).data,
  })

  const data = query.data?.map(api =>
    toConsumable(api, categoriesById, uomsById, itemImages[String(api.id)]),
  )

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateConsumable() {
  const queryClient = useQueryClient()
  const setItemImage = useMastersLocalStore(s => s.setItemImage)
  return useMutation({
    mutationFn: async (input: ConsumableInput) => {
      const result = await consumablesApi.create(toPayload(input))
      setItemImage(String(result.data.id), input.imageUrl)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consumables'] }),
  })
}

export function useUpdateConsumable() {
  const queryClient = useQueryClient()
  const setItemImage = useMastersLocalStore(s => s.setItemImage)
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ConsumableInput> }) => {
      const result = await consumablesApi.update(Number(id), toPayload(payload))
      if ('imageUrl' in payload) setItemImage(id, payload.imageUrl)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consumables'] }),
  })
}

export function useDeleteConsumable() {
  const queryClient = useQueryClient()
  const removeItemImage = useMastersLocalStore(s => s.removeItemImage)
  return useMutation({
    mutationFn: async (id: string) => {
      await consumablesApi.remove(Number(id))
      removeItemImage(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['consumables'] }),
  })
}

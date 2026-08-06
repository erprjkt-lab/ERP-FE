import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { packingMaterialsApi } from '@/api/items'
import type { ApiItemCategory, ApiItemMaster, ApiUom } from '@/types/api/masters'
import type { PackingMaterial } from '@/types/masters'
import type { PackingMaterialInput } from '../store/mastersStore'
import { useItemCategories } from './useItemCategories'
import { useUoms } from './useUoms'

function idOrNull(id: number | null): string | null {
  return id ? String(id) : null
}

function toPackingMaterial(
  api: ApiItemMaster,
  categoriesById: Map<string, ApiItemCategory>,
  uomsById: Map<string, ApiUom>,
): PackingMaterial {
  const categoryId = idOrNull(api.category_id)
  const uomId = idOrNull(api.uom_id)
  return {
    id: String(api.id),
    code: api.item_code,
    name: api.item_name,
    categoryId,
    category: categoryId ? (categoriesById.get(categoryId)?.name ?? '') : '',
    uomId,
    uom: uomId ? (uomsById.get(uomId)?.name ?? '') : '',
    price: api.price ?? undefined,
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function toPayload(input: Partial<PackingMaterialInput>) {
  return {
    item_name: input.name,
    category_id: input.categoryId ? Number(input.categoryId) : null,
    uom_id: input.uomId ? Number(input.uomId) : null,
    price: input.price,
  }
}

export function usePackingMaterials() {
  const { data: categories = [] } = useItemCategories()
  const { data: uoms = [] } = useUoms()
  const categoriesById = new Map(categories.map(c => [String(c.id), c]))
  const uomsById = new Map(uoms.map(u => [String(u.id), u]))
  const query = useQuery({
    queryKey: ['packingMaterials'],
    queryFn: async () => (await packingMaterialsApi.list()).data,
  })

  const data = query.data?.map(api => toPackingMaterial(api, categoriesById, uomsById))

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreatePackingMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PackingMaterialInput) => packingMaterialsApi.create(toPayload(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packingMaterials'] }),
  })
}

export function useUpdatePackingMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PackingMaterialInput> }) =>
      packingMaterialsApi.update(Number(id), toPayload(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packingMaterials'] }),
  })
}

export function useDeletePackingMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => packingMaterialsApi.remove(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packingMaterials'] }),
  })
}

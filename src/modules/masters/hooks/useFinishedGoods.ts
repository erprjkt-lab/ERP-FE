import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishedGoodsApi } from '@/api/items'
import type { ApiItemCategory, ApiItemMaster, ApiMaterialGrade, ApiUom } from '@/types/api/masters'
import type { FinishedGood } from '@/types/masters'
import { useMastersLocalStore } from '../store/mastersLocalStore'
import type { FinishedGoodInput } from '../store/mastersStore'
import { useItemCategories } from './useItemCategories'
import { useMaterialGrades } from './useMaterialGrades'
import { useUoms } from './useUoms'

// item_master forces category_id/uom_id/material_grade to 0 (never NULL) when
// unset — treat 0 the same as null when resolving back to the frontend shape.
function idOrNull(id: number | null): string | null {
  return id ? String(id) : null
}

function toFinishedGood(
  api: ApiItemMaster,
  categoriesById: Map<string, ApiItemCategory>,
  uomsById: Map<string, ApiUom>,
  materialGradesById: Map<string, ApiMaterialGrade>,
  imageUrl: string | undefined,
): FinishedGood {
  const categoryId = idOrNull(api.category_id)
  const uomId = idOrNull(api.uom_id)
  const alternateUomId = idOrNull(api.alternate_uom_id)
  const materialGradeId = idOrNull(api.material_grade)
  return {
    id: String(api.id),
    code: api.item_code,
    name: api.item_name,
    categoryId,
    category: categoryId ? (categoriesById.get(categoryId)?.name ?? '') : '',
    brand: api.brand ?? undefined,
    uomId,
    uom: uomId ? (uomsById.get(uomId)?.name ?? '') : '',
    alternateUomId,
    alternateUom: alternateUomId ? uomsById.get(alternateUomId)?.name : undefined,
    hsnCode: api.hsn_code ?? undefined,
    gstPercent: api.gst_percent ?? undefined,
    description: api.description ?? undefined,
    status: api.status === 0 ? 'inactive' : 'active',
    imageUrl,
    customerId: api.party_id ? String(api.party_id) : null,
    customerName: undefined,
    customerPartNo: api.customer_part_no ?? undefined,
    drawingNo: api.drawing_no ?? undefined,
    drawingRevision: api.drawing_revision ?? undefined,
    drawingFileName: api.drawing_file ?? undefined,
    materialGradeId,
    materialGrade: materialGradeId
      ? materialGradesById.get(materialGradeId)?.material_grade
      : undefined,
    weight: api.weight ?? undefined,
    price: api.price ?? undefined,
    batchTracking: api.batch_tracking,
    heatTracking: api.heat_tracking,
    serialTracking: api.serial_tracking,
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function toPayload(input: Partial<FinishedGoodInput>) {
  return {
    item_name: input.name,
    category_id: input.categoryId ? Number(input.categoryId) : null,
    brand: input.brand,
    uom_id: input.uomId ? Number(input.uomId) : null,
    alternate_uom_id: input.alternateUomId ? Number(input.alternateUomId) : null,
    hsn_code: input.hsnCode,
    gst_percent: input.gstPercent,
    description: input.description,
    status: input.status === 'inactive' ? 0 : 1,
    party_id: input.customerId ? Number(input.customerId) : null,
    customer_part_no: input.customerPartNo,
    drawing_no: input.drawingNo,
    drawing_revision: input.drawingRevision,
    drawing_file: input.drawingFileName,
    material_grade: input.materialGradeId ? Number(input.materialGradeId) : null,
    weight: input.weight,
    price: input.price,
  }
}

function useLookupMaps() {
  const { data: categories } = useItemCategories()
  const { data: uoms } = useUoms()
  const { data: materialGrades } = useMaterialGrades()
  return {
    categoriesById: new Map(categories.map(c => [String(c.id), c])),
    uomsById: new Map(uoms.map(u => [String(u.id), u])),
    materialGradesById: new Map(materialGrades.map(m => [String(m.id), m])),
  }
}

export function useFinishedGoods() {
  const { categoriesById, uomsById, materialGradesById } = useLookupMaps()
  const itemImages = useMastersLocalStore(s => s.itemImages)
  const query = useQuery({
    queryKey: ['finishedGoods'],
    queryFn: async () => (await finishedGoodsApi.list()).data,
  })

  const data = query.data?.map(api =>
    toFinishedGood(api, categoriesById, uomsById, materialGradesById, itemImages[String(api.id)]),
  )

  return { ...query, data, isLoading: query.isLoading }
}

export function useFinishedGood(id: string | undefined) {
  const { categoriesById, uomsById, materialGradesById } = useLookupMaps()
  const itemImages = useMastersLocalStore(s => s.itemImages)
  const query = useQuery({
    queryKey: ['finishedGoods', id],
    queryFn: () => finishedGoodsApi.get(Number(id)),
    enabled: !!id,
  })

  const data =
    query.data && id
      ? toFinishedGood(
          query.data.data,
          categoriesById,
          uomsById,
          materialGradesById,
          itemImages[id],
        )
      : undefined

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateFinishedGood() {
  const queryClient = useQueryClient()
  const setItemImage = useMastersLocalStore(s => s.setItemImage)
  return useMutation({
    mutationFn: async (input: FinishedGoodInput) => {
      const result = await finishedGoodsApi.create(toPayload(input))
      setItemImage(String(result.data.id), input.imageUrl)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finishedGoods'] }),
  })
}

export function useUpdateFinishedGood() {
  const queryClient = useQueryClient()
  const setItemImage = useMastersLocalStore(s => s.setItemImage)
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<FinishedGoodInput> }) => {
      const result = await finishedGoodsApi.update(Number(id), toPayload(payload))
      if ('imageUrl' in payload) setItemImage(id, payload.imageUrl)
      return result
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finishedGoods'] })
      queryClient.invalidateQueries({ queryKey: ['finishedGoods', variables.id] })
    },
  })
}

export function useDeleteFinishedGood() {
  const queryClient = useQueryClient()
  const removeItemImage = useMastersLocalStore(s => s.removeItemImage)
  return useMutation({
    mutationFn: async (id: string) => {
      await finishedGoodsApi.remove(Number(id))
      removeItemImage(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finishedGoods'] }),
  })
}

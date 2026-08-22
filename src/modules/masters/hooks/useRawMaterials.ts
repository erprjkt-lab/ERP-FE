import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { rawMaterialsApi } from '@/api/items'
import type { ApiItemCategory, ApiItemMaster, ApiMaterialGrade, ApiUom } from '@/types/api/masters'
import type { RawMaterial } from '@/types/masters'
import { useMastersLocalStore } from '../store/mastersLocalStore'
import type { RawMaterialInput } from '../store/mastersStore'
import { useItemCategories } from './useItemCategories'
import { useMaterialGrades } from './useMaterialGrades'
import { useUoms } from './useUoms'

function idOrNull(id: number | null): string | null {
  return id ? String(id) : null
}

function toRawMaterial(
  api: ApiItemMaster,
  categoriesById: Map<string, ApiItemCategory>,
  uomsById: Map<string, ApiUom>,
  materialGradesById: Map<string, ApiMaterialGrade>,
  imageUrl: string | undefined,
): RawMaterial {
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
    materialGradeId,
    materialGrade: materialGradeId
      ? materialGradesById.get(materialGradeId)?.material_grade
      : undefined,
    materialType: api.material_type ?? undefined,
    shape: api.shape ?? undefined,
    diameter: api.diameter ?? undefined,
    width: api.width ?? undefined,
    thickness: api.thickness ?? undefined,
    length: api.length ?? undefined,
    density: api.density ?? undefined,
    color: api.color ?? undefined,
    price: api.price ?? undefined,
    batchTracking: api.batch_tracking,
    heatTracking: api.heat_tracking,
    serialTracking: api.serial_tracking,
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function toPayload(input: Partial<RawMaterialInput>) {
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
    material_grade: input.materialGradeId ? Number(input.materialGradeId) : null,
    material_type: input.materialType,
    shape: input.shape,
    diameter: input.diameter,
    width: input.width,
    thickness: input.thickness,
    length: input.length,
    density: input.density,
    color: input.color,
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

export function useRawMaterials() {
  const { categoriesById, uomsById, materialGradesById } = useLookupMaps()
  const itemImages = useMastersLocalStore(s => s.itemImages)
  const query = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: async () => (await rawMaterialsApi.list()).data,
  })

  const data = query.data?.map(api =>
    toRawMaterial(api, categoriesById, uomsById, materialGradesById, itemImages[String(api.id)]),
  )

  return { ...query, data, isLoading: query.isLoading }
}

export function useRawMaterial(id: string | undefined) {
  const { categoriesById, uomsById, materialGradesById } = useLookupMaps()
  const itemImages = useMastersLocalStore(s => s.itemImages)
  const query = useQuery({
    queryKey: ['rawMaterials', id],
    queryFn: () => rawMaterialsApi.get(Number(id)),
    enabled: !!id,
  })

  const data =
    query.data && id
      ? toRawMaterial(query.data.data, categoriesById, uomsById, materialGradesById, itemImages[id])
      : undefined

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateRawMaterial() {
  const queryClient = useQueryClient()
  const setItemImage = useMastersLocalStore(s => s.setItemImage)
  return useMutation({
    mutationFn: async (input: RawMaterialInput) => {
      const result = await rawMaterialsApi.create(toPayload(input))
      setItemImage(String(result.data.id), input.imageUrl)
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rawMaterials'] }),
  })
}

export function useUpdateRawMaterial() {
  const queryClient = useQueryClient()
  const setItemImage = useMastersLocalStore(s => s.setItemImage)
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<RawMaterialInput> }) => {
      const result = await rawMaterialsApi.update(Number(id), toPayload(payload))
      if ('imageUrl' in payload) setItemImage(id, payload.imageUrl)
      return result
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rawMaterials'] })
      queryClient.invalidateQueries({ queryKey: ['rawMaterials', variables.id] })
    },
  })
}

export function useDeleteRawMaterial() {
  const queryClient = useQueryClient()
  const removeItemImage = useMastersLocalStore(s => s.removeItemImage)
  return useMutation({
    mutationFn: async (id: string) => {
      await rawMaterialsApi.remove(Number(id))
      removeItemImage(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rawMaterials'] }),
  })
}

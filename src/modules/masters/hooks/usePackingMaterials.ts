import type { PackingMaterialInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function usePackingMaterials() {
  const packingMaterials = useMastersStore(s => s.packingMaterials)
  return { data: packingMaterials, isLoading: false }
}

export function useCreatePackingMaterial() {
  const create = useMastersStore(s => s.createPackingMaterial)
  return { mutateAsync: async (input: PackingMaterialInput) => create(input), isPending: false }
}

export function useUpdatePackingMaterial() {
  const update = useMastersStore(s => s.updatePackingMaterial)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<PackingMaterialInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeletePackingMaterial() {
  const del = useMastersStore(s => s.deletePackingMaterial)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

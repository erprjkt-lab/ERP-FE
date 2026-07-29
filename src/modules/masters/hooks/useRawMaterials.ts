import type { RawMaterialInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useRawMaterials() {
  const rawMaterials = useMastersStore(s => s.rawMaterials)
  return { data: rawMaterials, isLoading: false }
}

export function useRawMaterial(id: string | undefined) {
  const { data } = useRawMaterials()
  return { data: id ? data.find(r => r.id === id) : undefined, isLoading: false }
}

export function useCreateRawMaterial() {
  const create = useMastersStore(s => s.createRawMaterial)
  return { mutateAsync: async (input: RawMaterialInput) => create(input), isPending: false }
}

export function useUpdateRawMaterial() {
  const update = useMastersStore(s => s.updateRawMaterial)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<RawMaterialInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteRawMaterial() {
  const del = useMastersStore(s => s.deleteRawMaterial)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

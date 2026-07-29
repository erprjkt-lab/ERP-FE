import type { SupplierInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useSuppliers() {
  const suppliers = useMastersStore(s => s.suppliers)
  return { data: suppliers, isLoading: false }
}

export function useSupplier(id: string | undefined) {
  const { data } = useSuppliers()
  return { data: id ? data.find(s => s.id === id) : undefined, isLoading: false }
}

export function useCreateSupplier() {
  const create = useMastersStore(s => s.createSupplier)
  return { mutateAsync: async (input: SupplierInput) => create(input), isPending: false }
}

export function useUpdateSupplier() {
  const update = useMastersStore(s => s.updateSupplier)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<SupplierInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteSupplier() {
  const del = useMastersStore(s => s.deleteSupplier)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

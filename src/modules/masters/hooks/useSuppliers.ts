import type { Supplier } from '@/types/masters'
import type { SupplierInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { useLocationLookups } from './useLocationLookups'

function composeSupplier(
  supplier: Supplier,
  lookups: ReturnType<typeof useLocationLookups>,
): Supplier {
  return {
    ...supplier,
    country: supplier.countryId ? lookups.countryById.get(supplier.countryId) : undefined,
    state: supplier.stateId ? lookups.stateById.get(supplier.stateId) : undefined,
    city: supplier.cityId ? lookups.cityById.get(supplier.cityId) : undefined,
  }
}

export function useSuppliers() {
  const suppliers = useMastersStore(s => s.suppliers)
  const lookups = useLocationLookups()
  const data = suppliers.map(s => composeSupplier(s, lookups))
  return { data, isLoading: lookups.isLoading }
}

export function useSupplier(id: string | undefined) {
  const { data, isLoading } = useSuppliers()
  return { data: id ? data.find(s => s.id === id) : undefined, isLoading }
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

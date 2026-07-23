import type { Vendor } from '@/types/masters'
import type { VendorInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { useLocationLookups } from './useLocationLookups'

function composeVendor(vendor: Vendor, lookups: ReturnType<typeof useLocationLookups>): Vendor {
  return {
    ...vendor,
    country: vendor.countryId ? lookups.countryById.get(vendor.countryId) : undefined,
    state: vendor.stateId ? lookups.stateById.get(vendor.stateId) : undefined,
    city: vendor.cityId ? lookups.cityById.get(vendor.cityId) : undefined,
  }
}

export function useVendors() {
  const vendors = useMastersStore(s => s.vendors)
  const lookups = useLocationLookups()
  const data = vendors.map(v => composeVendor(v, lookups))
  return { data, isLoading: lookups.isLoading }
}

export function useVendor(id: string | undefined) {
  const { data, isLoading } = useVendors()
  return { data: id ? data.find(v => v.id === id) : undefined, isLoading }
}

export function useCreateVendor() {
  const create = useMastersStore(s => s.createVendor)
  return { mutateAsync: async (input: VendorInput) => create(input), isPending: false }
}

export function useUpdateVendor() {
  const update = useMastersStore(s => s.updateVendor)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<VendorInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteVendor() {
  const del = useMastersStore(s => s.deleteVendor)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

import type { VendorInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useVendors() {
  const vendors = useMastersStore(s => s.vendors)
  return { data: vendors, isLoading: false }
}

export function useVendor(id: string | undefined) {
  const { data } = useVendors()
  return { data: id ? data.find(v => v.id === id) : undefined, isLoading: false }
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

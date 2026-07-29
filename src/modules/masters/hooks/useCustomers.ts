import type { CustomerInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useCustomers() {
  const customers = useMastersStore(s => s.customers)
  return { data: customers, isLoading: false }
}

export function useCustomer(id: string | undefined) {
  const { data } = useCustomers()
  return { data: id ? data.find(c => c.id === id) : undefined, isLoading: false }
}

export function useCreateCustomer() {
  const create = useMastersStore(s => s.createCustomer)
  return { mutateAsync: async (input: CustomerInput) => create(input), isPending: false }
}

export function useUpdateCustomer() {
  const update = useMastersStore(s => s.updateCustomer)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<CustomerInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteCustomer() {
  const del = useMastersStore(s => s.deleteCustomer)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

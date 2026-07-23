import type { Customer } from '@/types/masters'
import type { CustomerInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { useLocationLookups } from './useLocationLookups'

function composeCustomer(
  customer: Customer,
  lookups: ReturnType<typeof useLocationLookups>,
): Customer {
  return {
    ...customer,
    country: customer.countryId ? lookups.countryById.get(customer.countryId) : undefined,
    state: customer.stateId ? lookups.stateById.get(customer.stateId) : undefined,
    city: customer.cityId ? lookups.cityById.get(customer.cityId) : undefined,
  }
}

export function useCustomers() {
  const customers = useMastersStore(s => s.customers)
  const lookups = useLocationLookups()
  const data = customers.map(c => composeCustomer(c, lookups))
  return { data, isLoading: lookups.isLoading }
}

export function useCustomer(id: string | undefined) {
  const { data, isLoading } = useCustomers()
  return { data: id ? data.find(c => c.id === id) : undefined, isLoading }
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

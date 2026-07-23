import { useMastersStore } from '../store/mastersStore'

export function useCountries() {
  const data = useMastersStore(s => s.countries)
  return { data, isLoading: false }
}

export function useCreateCountry() {
  const create = useMastersStore(s => s.createCountry)
  return { mutateAsync: async (input: { name: string }) => create(input), isPending: false }
}

export function useUpdateCountry() {
  const update = useMastersStore(s => s.updateCountry)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: { name: string } }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteCountry() {
  const del = useMastersStore(s => s.deleteCountry)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

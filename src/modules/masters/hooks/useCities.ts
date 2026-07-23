import type { City } from '@/types/masters'
import { useMastersStore } from '../store/mastersStore'
import { useStates } from './useStates'

export function useCities() {
  const cities = useMastersStore(s => s.cities)
  const { data: states } = useStates()
  const stateById = new Map(states.map(s => [s.id, s]))

  const data: City[] = cities.map(city => ({
    ...city,
    state: city.stateId ? stateById.get(city.stateId) : undefined,
  }))

  return { data, isLoading: false }
}

export function useCreateCity() {
  const create = useMastersStore(s => s.createCity)
  return {
    mutateAsync: async (input: { name: string; stateId: string | null }) => create(input),
    isPending: false,
  }
}

export function useUpdateCity() {
  const update = useMastersStore(s => s.updateCity)
  return {
    mutateAsync: async ({
      id,
      payload,
    }: {
      id: string
      payload: { name: string; stateId: string | null }
    }) => update(id, payload),
    isPending: false,
  }
}

export function useDeleteCity() {
  const del = useMastersStore(s => s.deleteCity)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

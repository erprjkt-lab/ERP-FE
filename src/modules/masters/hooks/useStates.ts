import type { State } from '@/types/masters'
import { useMastersStore } from '../store/mastersStore'
import { useCountries } from './useCountries'

export function useStates() {
  const states = useMastersStore(s => s.states)
  const { data: countries } = useCountries()
  const countryById = new Map(countries.map(c => [c.id, c]))

  const data: State[] = states.map(state => ({
    ...state,
    country: state.countryId ? countryById.get(state.countryId) : undefined,
  }))

  return { data, isLoading: false }
}

export function useCreateState() {
  const create = useMastersStore(s => s.createState)
  return {
    mutateAsync: async (input: { name: string; countryId: string | null }) => create(input),
    isPending: false,
  }
}

export function useUpdateState() {
  const update = useMastersStore(s => s.updateState)
  return {
    mutateAsync: async ({
      id,
      payload,
    }: {
      id: string
      payload: { name: string; countryId: string | null }
    }) => update(id, payload),
    isPending: false,
  }
}

export function useDeleteState() {
  const del = useMastersStore(s => s.deleteState)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

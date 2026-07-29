import type { FixtureInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useFixtures() {
  const fixtures = useMastersStore(s => s.fixtures)
  return { data: fixtures, isLoading: false }
}

export function useCreateFixture() {
  const create = useMastersStore(s => s.createFixture)
  return { mutateAsync: async (input: FixtureInput) => create(input), isPending: false }
}

export function useUpdateFixture() {
  const update = useMastersStore(s => s.updateFixture)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<FixtureInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteFixture() {
  const del = useMastersStore(s => s.deleteFixture)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

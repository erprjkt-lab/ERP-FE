import type { ConsumableInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useConsumables() {
  const consumables = useMastersStore(s => s.consumables)
  return { data: consumables, isLoading: false }
}

export function useCreateConsumable() {
  const create = useMastersStore(s => s.createConsumable)
  return { mutateAsync: async (input: ConsumableInput) => create(input), isPending: false }
}

export function useUpdateConsumable() {
  const update = useMastersStore(s => s.updateConsumable)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<ConsumableInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteConsumable() {
  const del = useMastersStore(s => s.deleteConsumable)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

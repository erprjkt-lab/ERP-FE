import type { DieBlockInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useDieBlocks() {
  const dieBlocks = useMastersStore(s => s.dieBlocks)
  return { data: dieBlocks, isLoading: false }
}

export function useCreateDieBlock() {
  const create = useMastersStore(s => s.createDieBlock)
  return { mutateAsync: async (input: DieBlockInput) => create(input), isPending: false }
}

export function useUpdateDieBlock() {
  const update = useMastersStore(s => s.updateDieBlock)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<DieBlockInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteDieBlock() {
  const del = useMastersStore(s => s.deleteDieBlock)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

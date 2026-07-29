import type { FinishedGoodInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useFinishedGoods() {
  const finishedGoods = useMastersStore(s => s.finishedGoods)
  return { data: finishedGoods, isLoading: false }
}

export function useFinishedGood(id: string | undefined) {
  const { data } = useFinishedGoods()
  return { data: id ? data.find(f => f.id === id) : undefined, isLoading: false }
}

export function useCreateFinishedGood() {
  const create = useMastersStore(s => s.createFinishedGood)
  return { mutateAsync: async (input: FinishedGoodInput) => create(input), isPending: false }
}

export function useUpdateFinishedGood() {
  const update = useMastersStore(s => s.updateFinishedGood)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<FinishedGoodInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteFinishedGood() {
  const del = useMastersStore(s => s.deleteFinishedGood)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

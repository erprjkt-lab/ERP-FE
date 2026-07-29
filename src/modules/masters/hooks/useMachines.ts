import type { MachineInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useMachines() {
  const machines = useMastersStore(s => s.machines)
  return { data: machines, isLoading: false }
}

export function useCreateMachine() {
  const create = useMastersStore(s => s.createMachine)
  return { mutateAsync: async (input: MachineInput) => create(input), isPending: false }
}

export function useUpdateMachine() {
  const update = useMastersStore(s => s.updateMachine)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<MachineInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteMachine() {
  const del = useMastersStore(s => s.deleteMachine)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

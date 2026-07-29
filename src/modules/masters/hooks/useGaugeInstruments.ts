import type { GaugeInstrumentInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'

export function useGaugeInstruments() {
  const gaugeInstruments = useMastersStore(s => s.gaugeInstruments)
  return { data: gaugeInstruments, isLoading: false }
}

export function useCreateGaugeInstrument() {
  const create = useMastersStore(s => s.createGaugeInstrument)
  return { mutateAsync: async (input: GaugeInstrumentInput) => create(input), isPending: false }
}

export function useUpdateGaugeInstrument() {
  const update = useMastersStore(s => s.updateGaugeInstrument)
  return {
    mutateAsync: async ({ id, payload }: { id: string; payload: Partial<GaugeInstrumentInput> }) =>
      update(id, payload),
    isPending: false,
  }
}

export function useDeleteGaugeInstrument() {
  const del = useMastersStore(s => s.deleteGaugeInstrument)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

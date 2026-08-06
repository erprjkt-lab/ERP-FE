import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gaugeInstrumentsApi } from '@/api/items'
import type { ApiItemCategory, ApiItemMaster } from '@/types/api/masters'
import type { GaugeInstrument } from '@/types/masters'
import type { GaugeInstrumentInput } from '../store/mastersStore'
import { useItemCategories } from './useItemCategories'

function idOrNull(id: number | null): string | null {
  return id ? String(id) : null
}

function toGaugeInstrument(
  api: ApiItemMaster,
  categoriesById: Map<string, ApiItemCategory>,
): GaugeInstrument {
  const categoryId = idOrNull(api.category_id)
  return {
    id: String(api.id),
    code: api.item_code,
    name: api.item_name,
    gaugeType: api.gauge_type ?? undefined,
    instrumentRange: api.instrument_range ?? undefined,
    accuracy: api.accuracy ?? undefined,
    leastCount: api.least_count ?? undefined,
    calibrationFrequency: api.calibration_frequency ?? undefined,
    calibrationDueDate: api.calibration_due_date ?? undefined,
    certificateNumber: api.certificate_number ?? undefined,
    manufacturer: api.manufacturer ?? undefined,
    categoryId,
    category: categoryId ? categoriesById.get(categoryId)?.name : undefined,
    price: api.price ?? undefined,
    createdAt: api.created_at ?? '',
    updatedAt: api.updated_at ?? '',
  }
}

function toPayload(input: Partial<GaugeInstrumentInput>) {
  return {
    item_name: input.name,
    gauge_type: input.gaugeType,
    instrument_range: input.instrumentRange,
    accuracy: input.accuracy,
    least_count: input.leastCount,
    calibration_frequency: input.calibrationFrequency,
    calibration_due_date: input.calibrationDueDate,
    certificate_number: input.certificateNumber,
    manufacturer: input.manufacturer,
    category_id: input.categoryId ? Number(input.categoryId) : null,
    price: input.price,
  }
}

export function useGaugeInstruments() {
  const { data: categories = [] } = useItemCategories()
  const categoriesById = new Map(categories.map(c => [String(c.id), c]))
  const query = useQuery({
    queryKey: ['gaugeInstruments'],
    queryFn: async () => (await gaugeInstrumentsApi.list()).data,
  })

  const data = query.data?.map(api => toGaugeInstrument(api, categoriesById))

  return { ...query, data, isLoading: query.isLoading }
}

export function useCreateGaugeInstrument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: GaugeInstrumentInput) => gaugeInstrumentsApi.create(toPayload(input)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gaugeInstruments'] }),
  })
}

export function useUpdateGaugeInstrument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GaugeInstrumentInput> }) =>
      gaugeInstrumentsApi.update(Number(id), toPayload(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gaugeInstruments'] }),
  })
}

export function useDeleteGaugeInstrument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gaugeInstrumentsApi.remove(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gaugeInstruments'] }),
  })
}

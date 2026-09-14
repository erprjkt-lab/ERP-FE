import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInspectionParameter,
  deleteInspectionParameter,
  listInspectionParameters,
  updateInspectionParameter,
} from '@/api/inspectionParameters'
import type {
  ApiInspectionParameter,
  CreateInspectionParameterPayload,
  UpdateInspectionParameterPayload,
} from '@/types/api/production'
import type { InspectionParamType, InspectionParameter } from '@/types/production'

const PARAM_TYPE_FROM_API: Record<number, InspectionParamType> = {
  1: 'product',
  2: 'process',
}

export const PARAM_TYPE_TO_API: Record<InspectionParamType, number> = {
  product: 1,
  process: 2,
}

function toInspectionParameter(api: ApiInspectionParameter): InspectionParameter {
  return {
    id: String(api.id),
    processId: String(api.process_id),
    processName: api.process_name ?? '',
    paramType: PARAM_TYPE_FROM_API[api.param_type] ?? 'product',
    parameter: api.parameter,
    specification: api.specification,
    min: api.min != null ? Number(api.min) : undefined,
    max: api.max != null ? Number(api.max) : undefined,
    machineTool: api.machine_tool ?? undefined,
    instrument: api.instrument ?? undefined,
    charClass: api.char_class ?? undefined,
    size: api.size ?? undefined,
    frequency: api.frequency != null ? Number(api.frequency) : undefined,
    freqUnit: api.freq_unit ?? undefined,
    reactionPlan: api.reaction_plan ?? undefined,
    controlMethod: api.control_method ?? undefined,
    status: api.status === 0 ? 'inactive' : 'active',
  }
}

export function useInspectionParameters(itemId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'inspectionParameters', itemId],
    queryFn: async () =>
      (await listInspectionParameters(Number(itemId))).data.map(toInspectionParameter),
    enabled: !!itemId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useCreateInspectionParameter(itemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInspectionParameterPayload) =>
      createInspectionParameter(Number(itemId), payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['production', 'inspectionParameters', itemId] }),
  })
}

export function useUpdateInspectionParameter(itemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInspectionParameterPayload }) =>
      updateInspectionParameter(Number(id), payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['production', 'inspectionParameters', itemId] }),
  })
}

export function useDeleteInspectionParameter(itemId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteInspectionParameter(Number(id)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['production', 'inspectionParameters', itemId] }),
  })
}

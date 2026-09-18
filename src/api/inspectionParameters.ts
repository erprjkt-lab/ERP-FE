import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type {
  ApiInspectionParameter,
  CreateInspectionParameterPayload,
  UpdateInspectionParameterPayload,
} from '@/types/api/production'

export function listInspectionParameters(
  itemId: number,
): Promise<ApiEnvelope<ApiInspectionParameter[]>> {
  return apiRequest(`/api/v1/items/${itemId}/inspection-parameters`)
}

export function createInspectionParameter(
  itemId: number,
  payload: CreateInspectionParameterPayload,
): Promise<ApiEnvelope<ApiInspectionParameter>> {
  return apiRequest(`/api/v1/items/${itemId}/inspection-parameters`, {
    method: 'POST',
    body: payload,
  })
}

export function updateInspectionParameter(
  id: number,
  payload: UpdateInspectionParameterPayload,
): Promise<ApiEnvelope<ApiInspectionParameter>> {
  return apiRequest(`/api/v1/inspection-parameters/${id}`, { method: 'PUT', body: payload })
}

export function deleteInspectionParameter(id: number): Promise<void> {
  return apiRequest(`/api/v1/inspection-parameters/${id}`, { method: 'DELETE' })
}

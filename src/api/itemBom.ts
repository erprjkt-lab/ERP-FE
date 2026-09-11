import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type {
  ApiItemBomLine,
  CreateItemBomLinePayload,
  UpdateItemBomLinePayload,
} from '@/types/api/production'

export function listItemBom(itemId: number): Promise<ApiEnvelope<ApiItemBomLine[]>> {
  return apiRequest(`/api/v1/items/${itemId}/bom`)
}

export function createItemBomLine(
  itemId: number,
  payload: CreateItemBomLinePayload,
): Promise<ApiEnvelope<ApiItemBomLine>> {
  return apiRequest(`/api/v1/items/${itemId}/bom`, { method: 'POST', body: payload })
}

export function updateItemBomLine(
  id: number,
  payload: UpdateItemBomLinePayload,
): Promise<ApiEnvelope<ApiItemBomLine>> {
  return apiRequest(`/api/v1/item-bom/${id}`, { method: 'PUT', body: payload })
}

export function deleteItemBomLine(id: number): Promise<void> {
  return apiRequest(`/api/v1/item-bom/${id}`, { method: 'DELETE' })
}

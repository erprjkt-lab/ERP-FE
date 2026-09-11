import { apiRequest } from '@/api/client'
import type { ApiEnvelope } from '@/types/api'
import type { ApiItemProcessRouteStep, ItemProcessRouteStepInput } from '@/types/api/production'

export function getItemProcessRoute(
  itemId: number,
): Promise<ApiEnvelope<ApiItemProcessRouteStep[]>> {
  return apiRequest(`/api/v1/items/${itemId}/process-route`)
}

export function defineItemProcessRoute(
  itemId: number,
  steps: ItemProcessRouteStepInput[],
): Promise<ApiEnvelope<ApiItemProcessRouteStep[]>> {
  return apiRequest(`/api/v1/items/${itemId}/process-route`, {
    method: 'POST',
    body: { steps },
  })
}

export function deleteItemProcessRoute(itemId: number): Promise<void> {
  return apiRequest(`/api/v1/items/${itemId}/process-route`, { method: 'DELETE' })
}

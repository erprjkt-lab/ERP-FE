import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiItemCategory,
  CreateItemCategoryPayload,
  UpdateItemCategoryPayload,
} from '@/types/api/masters'

// Flat list only — this app doesn't build a category-tree admin UI, so the
// `/item-categories/tree` endpoint isn't needed here.
export function listItemCategories(): Promise<PaginatedEnvelope<ApiItemCategory>> {
  return apiRequest('/api/v1/item-categories', { query: { per_page: 200 } })
}

export function getItemCategory(id: number): Promise<ApiEnvelope<ApiItemCategory>> {
  return apiRequest(`/api/v1/item-categories/${id}`)
}

export function createItemCategory(
  payload: CreateItemCategoryPayload,
): Promise<ApiEnvelope<ApiItemCategory>> {
  return apiRequest('/api/v1/item-categories', { method: 'POST', body: payload })
}

export function updateItemCategory(
  id: number,
  payload: UpdateItemCategoryPayload,
): Promise<ApiEnvelope<ApiItemCategory>> {
  return apiRequest(`/api/v1/item-categories/${id}`, { method: 'PUT', body: payload })
}

export function deleteItemCategory(id: number): Promise<void> {
  return apiRequest(`/api/v1/item-categories/${id}`, { method: 'DELETE' })
}

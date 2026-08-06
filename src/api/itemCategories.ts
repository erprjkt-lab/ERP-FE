import { apiRequest } from '@/api/client'
import type { PaginatedEnvelope } from '@/types/api'
import type { ApiItemCategory } from '@/types/api/masters'

// Flat list only — this app doesn't build a category-tree admin UI, so the
// `/item-categories/tree` endpoint isn't needed here.
export function listItemCategories(): Promise<PaginatedEnvelope<ApiItemCategory>> {
  return apiRequest('/api/v1/item-categories', { query: { per_page: 200 } })
}

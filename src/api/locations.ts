import { apiRequest } from '@/api/client'
import type { PaginatedEnvelope } from '@/types/api'
import type { ApiLocation } from '@/types/api/masters'

export function listLocations(): Promise<PaginatedEnvelope<ApiLocation>> {
  return apiRequest('/api/v1/locations', { query: { per_page: 100 } })
}

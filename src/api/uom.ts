import { apiRequest } from '@/api/client'
import type { PaginatedEnvelope } from '@/types/api'
import type { ApiUom } from '@/types/api/masters'

export function listUoms(page = 1, perPage = 200): Promise<PaginatedEnvelope<ApiUom>> {
  return apiRequest('/api/v1/uom-master', { query: { page, per_page: perPage } })
}

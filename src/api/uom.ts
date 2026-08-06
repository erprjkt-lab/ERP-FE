import { apiRequest } from '@/api/client'
import type { PaginatedEnvelope } from '@/types/api'
import type { ApiUom } from '@/types/api/masters'

export function listUoms(): Promise<PaginatedEnvelope<ApiUom>> {
  return apiRequest('/api/v1/uom-master', { query: { per_page: 200 } })
}

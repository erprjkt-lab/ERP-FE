import { apiRequest } from '@/api/client'
import type { PaginatedEnvelope } from '@/types/api'
import type { ApiMaterialGrade } from '@/types/api/masters'

export function listMaterialGrades(): Promise<PaginatedEnvelope<ApiMaterialGrade>> {
  return apiRequest('/api/v1/material-grades', { query: { per_page: 200 } })
}

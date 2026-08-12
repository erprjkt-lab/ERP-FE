import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiMaterialGrade,
  CreateMaterialGradePayload,
  UpdateMaterialGradePayload,
} from '@/types/api/masters'

export function listMaterialGrades(): Promise<PaginatedEnvelope<ApiMaterialGrade>> {
  return apiRequest('/api/v1/material-grades', { query: { per_page: 200 } })
}

export function getMaterialGrade(id: number): Promise<ApiEnvelope<ApiMaterialGrade>> {
  return apiRequest(`/api/v1/material-grades/${id}`)
}

export function createMaterialGrade(
  payload: CreateMaterialGradePayload,
): Promise<ApiEnvelope<ApiMaterialGrade>> {
  return apiRequest('/api/v1/material-grades', { method: 'POST', body: payload })
}

export function updateMaterialGrade(
  id: number,
  payload: UpdateMaterialGradePayload,
): Promise<ApiEnvelope<ApiMaterialGrade>> {
  return apiRequest(`/api/v1/material-grades/${id}`, { method: 'PUT', body: payload })
}

export function deleteMaterialGrade(id: number): Promise<void> {
  return apiRequest(`/api/v1/material-grades/${id}`, { method: 'DELETE' })
}

import { apiRequest } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { ApiEnvelope } from '@/types/api'
import type {
  AddInspectionReadingPayload,
  ApiInspectionReading,
  ApiInspectionReport,
  CreateIncomingInspectionReportPayload,
  CreateInspectionReportPayload,
} from '@/types/api/quality'

export function listInspectionReportsForJobCard(
  jobCardId: number,
): Promise<ApiEnvelope<ApiInspectionReport[]>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/inspection-reports`)
}

export function listIncomingInspectionReportsForGrnItem(
  grnItemId: number,
): Promise<ApiEnvelope<ApiInspectionReport[]>> {
  return apiRequest(`/api/v1/grn-items/${grnItemId}/iir-reports`)
}

export function getInspectionReport(id: number): Promise<ApiEnvelope<ApiInspectionReport>> {
  return apiRequest(`/api/v1/inspection-reports/${id}`)
}

export function createInspectionReport(
  jobCardId: number,
  payload: CreateInspectionReportPayload,
): Promise<ApiEnvelope<ApiInspectionReport>> {
  return apiRequest(`/api/v1/job-cards/${jobCardId}/inspection-reports`, {
    method: 'POST',
    body: payload,
  })
}

export function createIncomingInspectionReport(
  grnItemId: number,
  payload: CreateIncomingInspectionReportPayload,
): Promise<ApiEnvelope<ApiInspectionReport>> {
  return apiRequest(`/api/v1/grn-items/${grnItemId}/iir-reports`, {
    method: 'POST',
    body: payload,
  })
}

export function submitInspectionReport(id: number): Promise<ApiEnvelope<ApiInspectionReport>> {
  return apiRequest(`/api/v1/inspection-reports/${id}/submit`, { method: 'POST' })
}

export function approveInspectionReport(id: number): Promise<ApiEnvelope<ApiInspectionReport>> {
  return apiRequest(`/api/v1/inspection-reports/${id}/approve`, { method: 'POST' })
}

export function addInspectionReading(
  reportId: number,
  payload: AddInspectionReadingPayload,
): Promise<ApiEnvelope<ApiInspectionReading>> {
  return apiRequest(`/api/v1/inspection-reports/${reportId}/readings`, {
    method: 'POST',
    body: payload,
  })
}

// The PDF endpoint returns a binary file, not JSON, so it can't go through
// apiRequest — fetch it directly with the auth header and hand the browser a
// blob URL to open/download.
export async function downloadInspectionReportPdf(id: number, fileName: string): Promise<void> {
  const token = useAuthStore.getState().token
  const base = import.meta.env.VITE_API_BASE_URL
  const response = await fetch(`${base}/api/v1/inspection-reports/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) throw new Error('Failed to download the inspection report PDF')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

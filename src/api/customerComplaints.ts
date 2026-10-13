import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiComplaintResolution,
  ApiCustomerComplaint,
  ComplaintResolutionPayload,
  CustomerComplaintPayload,
} from '@/types/api/complaints'

/** Mirrors CustomerComplaintController::index()'s filters. */
export interface CustomerComplaintListParams {
  status?: number | null
  partyId?: string | null
  page?: number
  perPage?: number
}

export function listCustomerComplaints(
  params: CustomerComplaintListParams = {},
): Promise<PaginatedEnvelope<ApiCustomerComplaint>> {
  return apiRequest('/api/v1/customer-complaints', {
    query: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 100,
      ...(params.status !== null && params.status !== undefined ? { status: params.status } : {}),
      ...(params.partyId ? { party_id: params.partyId } : {}),
    },
  })
}

export function getCustomerComplaint(id: number): Promise<ApiEnvelope<ApiCustomerComplaint>> {
  return apiRequest(`/api/v1/customer-complaints/${id}`)
}

// Both writes go out as multipart: ERP-BE validates `defect_image` as a real
// uploaded file, so a JSON body would be rejected the moment one is attached.
function toFormData(values: Record<string, unknown>): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue
    if (value instanceof File) form.append(key, value)
    // Laravel's boolean rule reads "1"/"0", not "true"/"false".
    else if (typeof value === 'boolean') form.append(key, value ? '1' : '0')
    else form.append(key, String(value))
  }
  return form
}

export function createCustomerComplaint(
  payload: CustomerComplaintPayload,
): Promise<ApiEnvelope<ApiCustomerComplaint>> {
  return apiRequest('/api/v1/customer-complaints', {
    method: 'POST',
    body: toFormData(payload as unknown as Record<string, unknown>),
  })
}

export function updateCustomerComplaint(
  id: number,
  payload: Partial<CustomerComplaintPayload>,
): Promise<ApiEnvelope<ApiCustomerComplaint>> {
  // PHP populates neither $_POST nor $_FILES for a multipart PUT, so Laravel's
  // convention is to POST with _method=PUT. Keeps the file upload working on edit.
  return apiRequest(`/api/v1/customer-complaints/${id}`, {
    method: 'POST',
    body: toFormData({ ...(payload as unknown as Record<string, unknown>), _method: 'PUT' }),
  })
}

export function deleteCustomerComplaint(id: number): Promise<void> {
  return apiRequest(`/api/v1/customer-complaints/${id}`, { method: 'DELETE' })
}

export function startComplaintReview(id: number): Promise<ApiEnvelope<ApiCustomerComplaint>> {
  return apiRequest(`/api/v1/customer-complaints/${id}/start-review`, { method: 'POST' })
}

export function closeCustomerComplaint(id: number): Promise<ApiEnvelope<ApiCustomerComplaint>> {
  return apiRequest(`/api/v1/customer-complaints/${id}/close`, { method: 'POST' })
}

export function listComplaintResolutions(
  complaintId: number,
): Promise<ApiEnvelope<ApiComplaintResolution[]>> {
  return apiRequest(`/api/v1/customer-complaints/${complaintId}/resolutions`)
}

export function createComplaintResolution(
  complaintId: number,
  payload: ComplaintResolutionPayload,
): Promise<ApiEnvelope<ApiComplaintResolution>> {
  return apiRequest(`/api/v1/customer-complaints/${complaintId}/resolutions`, {
    method: 'POST',
    body: toFormData(payload as unknown as Record<string, unknown>),
  })
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resolveFileUrl } from '@/api/client'
import {
  closeCustomerComplaint,
  createComplaintResolution,
  createCustomerComplaint,
  deleteCustomerComplaint,
  getCustomerComplaint,
  listCustomerComplaints,
  startComplaintReview,
  updateCustomerComplaint,
  type CustomerComplaintListParams,
} from '@/api/customerComplaints'
import type {
  ApiComplaintResolution,
  ApiComplaintStatus,
  ApiCustomerComplaint,
  ComplaintResolutionPayload,
  CustomerComplaintPayload,
} from '@/types/api/complaints'
import type { ComplaintResolution, ComplaintStatus, CustomerComplaint } from '@/types/quality'

const STATUS_FROM_API: Record<ApiComplaintStatus, ComplaintStatus> = {
  0: 'open',
  1: 'in_review',
  2: 'resolved',
  3: 'closed',
}

export const STATUS_TO_API: Record<ComplaintStatus, ApiComplaintStatus> = {
  open: 0,
  in_review: 1,
  resolved: 2,
  closed: 3,
}

function toResolution(api: ApiComplaintResolution): ComplaintResolution {
  return {
    id: String(api.id),
    reportNumber: api.report_number,
    actionTaken: api.action_taken,
    customerFeedbackReference: api.customer_feedback_reference ?? undefined,
    remark: api.remark ?? undefined,
    documentUrl: resolveFileUrl(api.report_document_url),
    resolvedByName: api.resolved_by_name ?? undefined,
    resolvedAt: api.resolved_at ?? api.created_at ?? '',
  }
}

function toComplaint(api: ApiCustomerComplaint): CustomerComplaint {
  return {
    id: String(api.id),
    complaintNumber: api.complaint_number,
    complaintDate: api.complaint_date ?? '',
    partyId: String(api.party_id),
    partyName: api.party_name ?? '',
    salesInvoiceId: api.sales_invoice_id ? String(api.sales_invoice_id) : null,
    invoiceNumber: api.invoice_number ?? undefined,
    itemId: String(api.item_id),
    itemName: api.item_name ?? '',
    description: api.complaint_description,
    defectImageUrl: resolveFileUrl(api.defect_image_url),
    productReturned: Boolean(api.product_returned),
    returnLocationId: api.return_location_id ? String(api.return_location_id) : null,
    returnLocationName: api.return_location_name ?? undefined,
    batchNo: api.batch_no ?? undefined,
    returnedQty: api.returned_qty !== null ? Number(api.returned_qty) : null,
    stockMovementId: api.stock_movement_id ? String(api.stock_movement_id) : null,
    status: STATUS_FROM_API[api.status] ?? 'open',
    resolutions: (api.resolutions ?? []).map(toResolution),
    createdAt: api.created_at ?? '',
  }
}

export function useCustomerComplaints(params: CustomerComplaintListParams = {}) {
  const query = useQuery({
    queryKey: ['customer-complaints', params],
    queryFn: () => listCustomerComplaints(params),
    placeholderData: keepPreviousData,
  })
  return {
    data: (query.data?.data ?? []).map(toComplaint),
    meta: query.data?.meta,
    isLoading: query.isLoading,
  }
}

export function useCustomerComplaint(id: string | undefined) {
  const query = useQuery({
    queryKey: ['customer-complaints', id],
    queryFn: async () => (await getCustomerComplaint(Number(id))).data,
    enabled: !!id,
    select: toComplaint,
  })
  return { data: query.data, isLoading: query.isLoading }
}

function useComplaintInvalidation() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['customer-complaints'] })
}

export function useCreateCustomerComplaint() {
  const invalidate = useComplaintInvalidation()
  return useMutation({
    mutationFn: (payload: CustomerComplaintPayload) => createCustomerComplaint(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateCustomerComplaint() {
  const invalidate = useComplaintInvalidation()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CustomerComplaintPayload> }) =>
      updateCustomerComplaint(Number(id), payload),
    onSuccess: invalidate,
  })
}

export function useDeleteCustomerComplaint() {
  const invalidate = useComplaintInvalidation()
  return useMutation({
    mutationFn: (id: string) => deleteCustomerComplaint(Number(id)),
    onSuccess: invalidate,
  })
}

export function useStartComplaintReview() {
  const invalidate = useComplaintInvalidation()
  return useMutation({
    mutationFn: (id: string) => startComplaintReview(Number(id)),
    onSuccess: invalidate,
  })
}

export function useCloseCustomerComplaint() {
  const invalidate = useComplaintInvalidation()
  return useMutation({
    mutationFn: (id: string) => closeCustomerComplaint(Number(id)),
    onSuccess: invalidate,
  })
}

/** Filing a resolution is what moves a complaint to Resolved on ERP-BE. */
export function useCreateComplaintResolution() {
  const invalidate = useComplaintInvalidation()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ComplaintResolutionPayload }) =>
      createComplaintResolution(Number(id), payload),
    onSuccess: invalidate,
  })
}

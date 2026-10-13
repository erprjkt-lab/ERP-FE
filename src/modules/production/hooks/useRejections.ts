import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveRejectionReview,
  createRejectionReason,
  createRejectionReview,
  deleteRejectionReason,
  listPendingRejections,
  listRejectionReasons,
  listRejectionReviews,
  listRejectionsForJobCard,
  updateRejectionReason,
} from '@/api/rejections'
import type { RejectionReasonFilters } from '@/api/rejections'
import type {
  ApiRejection,
  ApiRejectionReason,
  ApiRejectionReview,
  CreateRejectionReviewPayload,
  RejectionReasonPayload,
} from '@/types/api/production'
import type { Rejection, RejectionReason, RejectionReview } from '@/types/production'

const DECISION_FROM_API: Record<number, RejectionReview['decision']> = {
  1: 'REJECT',
  2: 'REWORK',
}

const ORIGIN_FROM_API: Record<number, NonNullable<RejectionReview['originType']>> = {
  1: 'INHOUSE',
  2: 'OUTSOURCE',
}

function toRejection(api: ApiRejection): Rejection {
  return {
    id: String(api.id),
    jobCardId: String(api.job_card_id),
    jobCardNumber: api.job_card_number ?? undefined,
    processId: String(api.process_id),
    processName: api.process_name ?? undefined,
    processLogId: api.process_log_id != null ? String(api.process_log_id) : null,
    rejectedQty: Number(api.rejected_qty),
    pendingQty: api.pending_qty != null ? Number(api.pending_qty) : undefined,
    reasonCode: api.reason_code,
    status: api.review_status === 1 ? 'REVIEWED' : 'PENDING',
    createdAt: api.created_at ?? undefined,
  }
}

function toRejectionReview(api: ApiRejectionReview): RejectionReview {
  return {
    id: String(api.id),
    rejectionId: String(api.rejection_id),
    reviewedQty: Number(api.reviewed_qty),
    decision: DECISION_FROM_API[api.decision] ?? 'REJECT',
    reasonId: String(api.reason_id),
    reasonName: api.reason ?? undefined,
    originType: api.origin_type != null ? (ORIGIN_FROM_API[api.origin_type] ?? null) : null,
    machineId: api.machine_id != null ? String(api.machine_id) : null,
    machineName: api.machine_name ?? undefined,
    vendorId: api.vendor_id != null ? String(api.vendor_id) : null,
    vendorName: api.vendor_name ?? undefined,
    challanItemId: api.challan_item_id != null ? String(api.challan_item_id) : null,
    challanNumber: api.challan_number ?? undefined,
    reworkProcessId: api.rework_process_id != null ? String(api.rework_process_id) : null,
    reworkProcessName: api.rework_process_name ?? undefined,
    status: api.status === 1 ? 'APPROVED' : 'SUBMITTED',
    reviewedBy: api.reviewed_by != null ? String(api.reviewed_by) : null,
    approvedBy: api.approved_by != null ? String(api.approved_by) : null,
    approvedAt: api.approved_at,
    remark: api.remark,
    createdAt: api.created_at ?? undefined,
  }
}

function toRejectionReason(api: ApiRejectionReason): RejectionReason {
  return {
    id: String(api.id),
    type: api.type === 2 ? 'REWORK' : 'REJECT',
    reason: api.reason,
    code: api.code,
    status: api.status === 0 ? 'inactive' : 'active',
    createdAt: api.created_at ?? undefined,
  }
}

export function usePendingRejections() {
  const query = useQuery({
    queryKey: ['rejections', 'pending'],
    queryFn: async () => (await listPendingRejections()).data,
  })
  return { data: (query.data ?? []).map(toRejection), isLoading: query.isLoading }
}

export function useRejectionsForJobCard(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['rejections', 'byJobCard', jobCardId],
    queryFn: async () => (await listRejectionsForJobCard(Number(jobCardId))).data,
    enabled: !!jobCardId,
  })
  return { data: (query.data ?? []).map(toRejection), isLoading: query.isLoading }
}

export function useRejectionReviews(rejectionId: string | undefined) {
  const query = useQuery({
    queryKey: ['rejection-reviews', rejectionId],
    queryFn: async () => (await listRejectionReviews(Number(rejectionId))).data,
    enabled: !!rejectionId,
  })
  return { data: (query.data ?? []).map(toRejectionReview), isLoading: query.isLoading }
}

/**
 * Every approved Rework review across this job card's rejections — the batches the
 * shop floor is cleared to redo. One request per rejection, since ERP-BE only exposes
 * reviews nested under their rejection.
 */
export function useReworkReviewsForJobCard(jobCardId: string | undefined) {
  const { data: rejections, isLoading: rejectionsLoading } = useRejectionsForJobCard(jobCardId)

  const results = useQueries({
    queries: rejections.map(rejection => ({
      queryKey: ['rejection-reviews', rejection.id],
      queryFn: async () => (await listRejectionReviews(Number(rejection.id))).data,
    })),
  })

  const reviews = results
    .flatMap(result => result.data ?? [])
    .map(toRejectionReview)
    // Only an approved Rework decision can be cited on a process log.
    .filter(review => review.decision === 'REWORK' && review.status === 'APPROVED')

  return {
    data: reviews,
    rejections,
    isLoading: rejectionsLoading || results.some(result => result.isLoading),
  }
}

export function useCreateRejectionReview(rejectionId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateRejectionReviewPayload) =>
      toRejectionReview((await createRejectionReview(Number(rejectionId), payload)).data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rejection-reviews', rejectionId] })
      queryClient.invalidateQueries({ queryKey: ['rejections'] })
    },
  })
}

export function useApproveRejectionReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toRejectionReview((await approveRejectionReview(Number(id))).data),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['rejection-reviews', result.rejectionId] })
      queryClient.invalidateQueries({ queryKey: ['rejections'] })
      // An approved Rework review creates a job card movement server-side.
      queryClient.invalidateQueries({ queryKey: ['production', 'movements'] })
      queryClient.invalidateQueries({ queryKey: ['production', 'jobCards'] })
    },
  })
}

export function useRejectionReasons(filters: RejectionReasonFilters = {}) {
  const query = useQuery({
    queryKey: ['rejection-reasons', filters],
    queryFn: async () => (await listRejectionReasons(filters)).data,
  })
  return { data: (query.data ?? []).map(toRejectionReason), isLoading: query.isLoading }
}

export function useCreateRejectionReason() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RejectionReasonPayload) => createRejectionReason(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rejection-reasons'] }),
  })
}

export function useUpdateRejectionReason() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RejectionReasonPayload> }) =>
      updateRejectionReason(Number(id), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rejection-reasons'] }),
  })
}

export function useDeleteRejectionReason() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRejectionReason(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rejection-reasons'] }),
  })
}

import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import type {
  RejectionDecision,
  RejectionOrigin,
  RejectionReviewStatus,
  RejectionStatus,
} from '@/types/production'

export const MASTER_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

export const REJECTION_STATUS_LABELS: Record<RejectionStatus, string> = {
  PENDING: 'Pending Review',
  REVIEWED: 'Reviewed',
}

export const REJECTION_STATUS_BADGE: Record<RejectionStatus, StatusBadgeStatus> = {
  PENDING: 'pending',
  REVIEWED: 'approved',
}

export const DECISION_LABELS: Record<RejectionDecision, string> = {
  REJECT: 'Reject',
  REWORK: 'Rework',
}

export const ORIGIN_LABELS: Record<RejectionOrigin, string> = {
  INHOUSE: 'Inhouse',
  OUTSOURCE: 'Outsource',
}

export const REJECTION_REVIEW_STATUS_LABELS: Record<RejectionReviewStatus, string> = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
}

export const REJECTION_REVIEW_STATUS_BADGE: Record<RejectionReviewStatus, StatusBadgeStatus> = {
  SUBMITTED: 'pending',
  APPROVED: 'approved',
}

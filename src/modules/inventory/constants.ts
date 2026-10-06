import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import type {
  StockAdjustmentReason,
  StockAdjustmentStatus,
  StockRequisitionPriority,
  StockRequisitionStatus,
} from '@/types/inventory'

export const STOCK_REQUISITION_PRIORITY_OPTIONS: {
  label: string
  value: StockRequisitionPriority
}[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

export const STOCK_REQUISITION_STATUS_LABELS: Record<StockRequisitionStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export const STOCK_REQUISITION_STATUS_BADGE: Record<StockRequisitionStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
}

export const STOCK_ADJUSTMENT_REASON_OPTIONS: { label: string; value: StockAdjustmentReason }[] = [
  { label: 'Physical Count', value: 'PHYSICAL_COUNT' },
  { label: 'Damage', value: 'DAMAGE' },
  { label: 'Expiry', value: 'EXPIRY' },
  { label: 'Other', value: 'OTHER' },
]

export const STOCK_ADJUSTMENT_STATUS_LABELS: Record<StockAdjustmentStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  CANCELLED: 'Cancelled',
}

export const STOCK_ADJUSTMENT_STATUS_BADGE: Record<StockAdjustmentStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  CANCELLED: 'cancelled',
}

// Mirrors StockMovement::TYPE_LABELS on the backend — kept in sync manually
// since the ledger only returns the numeric code plus a label string, and we
// need the numeric code separately to build the filter dropdown.
export const STOCK_MOVEMENT_TYPE_LABELS: Record<number, string> = {
  1: 'GRN Receipt',
  2: 'QC Accept',
  3: 'QC Reject',
  4: 'Reversal',
  5: 'Sales Issue',
  6: 'Production Issue',
  7: 'Production Receipt',
  8: 'Packing Issue',
  9: 'Stock Transfer',
  10: 'Purchase Return',
  11: 'Production Return',
  12: 'General Issue',
  13: 'Adjustment In',
  14: 'Adjustment Out',
  15: 'Direct Issue',
}

export const STOCK_MOVEMENT_TYPE_OPTIONS = Object.entries(STOCK_MOVEMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value: Number(value), label }),
)

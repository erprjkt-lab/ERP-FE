import type {
  GrnLineStatus,
  GrnStatus,
  Priority,
  PurchaseEnquirySupplierStatus,
  PurchaseEnquiryStatus,
  PurchaseOrderStatus,
  PurchaseRequisitionStatus,
  SupplierQuotationStatus,
} from '@/types/procurement'
import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'

export const PRIORITY_OPTIONS: { label: string; value: Priority }[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Urgent', value: 'URGENT' },
]

export const REQUISITION_STATUS_LABELS: Record<PurchaseRequisitionStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export const REQUISITION_STATUS_BADGE: Record<PurchaseRequisitionStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CLOSED: 'archived',
  CANCELLED: 'cancelled',
}

export const ENQUIRY_STATUS_LABELS: Record<PurchaseEnquiryStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_RESPONDED: 'Partially Responded',
  RESPONDED: 'Responded',
  COMPARISON_PENDING: 'Comparison Pending',
  SUPPLIER_SELECTED: 'Supplier Selected',
  PO_CREATED: 'PO Created',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export const ENQUIRY_STATUS_BADGE: Record<PurchaseEnquiryStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  SENT: 'pending',
  PARTIALLY_RESPONDED: 'pending',
  RESPONDED: 'active',
  COMPARISON_PENDING: 'pending',
  SUPPLIER_SELECTED: 'approved',
  PO_CREATED: 'approved',
  CLOSED: 'archived',
  CANCELLED: 'cancelled',
}

export const SUPPLIER_STATUS_LABELS: Record<PurchaseEnquirySupplierStatus, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  RESPONDED: 'Responded',
  DECLINED: 'Declined',
  NO_RESPONSE: 'No Response',
  SELECTED: 'Selected',
  NOT_SELECTED: 'Not Selected',
}

export const SUPPLIER_STATUS_BADGE: Record<PurchaseEnquirySupplierStatus, StatusBadgeStatus> = {
  PENDING: 'draft',
  SENT: 'pending',
  RESPONDED: 'active',
  DECLINED: 'cancelled',
  NO_RESPONSE: 'inactive',
  SELECTED: 'approved',
  NOT_SELECTED: 'inactive',
}

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  SENT: 'Sent',
  PARTIALLY_RECEIVED: 'Partially Received',
  RECEIVED: 'Received',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export const PO_STATUS_BADGE: Record<PurchaseOrderStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  SENT: 'pending',
  PARTIALLY_RECEIVED: 'pending',
  RECEIVED: 'active',
  CLOSED: 'archived',
  CANCELLED: 'cancelled',
}

export const QUOTATION_STATUS_LABELS: Record<SupplierQuotationStatus, string> = {
  RECEIVED: 'Received',
  SELECTED: 'Selected',
  NOT_SELECTED: 'Not Selected',
}

export const QUOTATION_STATUS_BADGE: Record<SupplierQuotationStatus, StatusBadgeStatus> = {
  RECEIVED: 'active',
  SELECTED: 'approved',
  NOT_SELECTED: 'inactive',
}

export const GRN_STATUS_LABELS: Record<GrnStatus, string> = {
  0: 'Draft',
  1: 'Received',
  2: 'QC Pending',
  3: 'Completed',
  4: 'Cancelled',
}

export const GRN_STATUS_BADGE: Record<GrnStatus, StatusBadgeStatus> = {
  0: 'draft',
  1: 'pending',
  2: 'pending',
  3: 'approved',
  4: 'cancelled',
}

export const GRN_LINE_STATUS_LABELS: Record<GrnLineStatus, string> = {
  0: 'Received (Blocked)',
  1: 'QC Pending',
  2: 'QC Done',
  3: 'Stock Posted',
  4: 'Cancelled',
}

export const GRN_LINE_STATUS_BADGE: Record<GrnLineStatus, StatusBadgeStatus> = {
  0: 'pending',
  1: 'pending',
  2: 'active',
  3: 'approved',
  4: 'cancelled',
}

import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import type {
  DeliveryChallanStatus,
  FeasibleStatus,
  SalesEnquiryItemStatus,
  SalesEnquiryStatus,
  SalesInvoiceStatus,
  SalesOrderStatus,
  SalesQuotationStatus,
} from '@/types/sales'

export const ENQUIRY_STATUS_LABELS: Record<SalesEnquiryStatus, string> = {
  OPEN: 'Open',
  QUOTED: 'Quoted',
  CLOSED: 'Closed',
}

export const ENQUIRY_STATUS_BADGE: Record<SalesEnquiryStatus, StatusBadgeStatus> = {
  OPEN: 'open',
  QUOTED: 'active',
  CLOSED: 'closed',
}

export const ENQUIRY_ITEM_STATUS_LABELS: Record<SalesEnquiryItemStatus, string> = {
  OPEN: 'Open',
  QUOTED: 'Quoted',
  CLOSED: 'Closed',
}

export const ENQUIRY_ITEM_STATUS_BADGE: Record<SalesEnquiryItemStatus, StatusBadgeStatus> = {
  OPEN: 'open',
  QUOTED: 'active',
  CLOSED: 'closed',
}

export const FEASIBLE_STATUS_LABELS: Record<FeasibleStatus, string> = {
  PENDING: 'Pending',
  FEASIBLE: 'Feasible',
  NOT_FEASIBLE: 'Not Feasible',
}

export const FEASIBLE_STATUS_BADGE: Record<FeasibleStatus, StatusBadgeStatus> = {
  PENDING: 'pending',
  FEASIBLE: 'approved',
  NOT_FEASIBLE: 'rejected',
}

export const FEASIBLE_STATUS_OPTIONS = (
  Object.keys(FEASIBLE_STATUS_LABELS) as FeasibleStatus[]
).map(value => ({ value, label: FEASIBLE_STATUS_LABELS[value] }))

export const QUOTATION_STATUS_LABELS: Record<SalesQuotationStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  REVISED: 'Revised',
}

export const QUOTATION_STATUS_BADGE: Record<SalesQuotationStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  SENT: 'pending',
  ACCEPTED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'inactive',
  REVISED: 'archived',
}

export const ORDER_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

export const ORDER_STATUS_BADGE: Record<SalesOrderStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  CONFIRMED: 'approved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
}

export const CHALLAN_STATUS_LABELS: Record<DeliveryChallanStatus, string> = {
  DISPATCHED: 'Dispatched',
  CANCELLED: 'Cancelled',
}

export const CHALLAN_STATUS_BADGE: Record<DeliveryChallanStatus, StatusBadgeStatus> = {
  DISPATCHED: 'active',
  CANCELLED: 'cancelled',
}

export const INVOICE_STATUS_LABELS: Record<SalesInvoiceStatus, string> = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  CANCELLED: 'Cancelled',
}

export const INVOICE_STATUS_BADGE: Record<SalesInvoiceStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  POSTED: 'approved',
  CANCELLED: 'cancelled',
}

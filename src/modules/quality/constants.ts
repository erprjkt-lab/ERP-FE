import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import type { ComplaintStatus, InspectionReportStatus, InspectionReportType } from '@/types/quality'

export const REPORT_TYPE_LABELS: Record<InspectionReportType, string> = {
  IPR: 'In-Process Inspection Report',
  FIR: 'Final Inspection Report',
  IIR: 'Incoming Inspection Report',
}

export const REPORT_STATUS_LABELS: Record<InspectionReportStatus, string> = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
}

export const REPORT_STATUS_BADGE: Record<InspectionReportStatus, StatusBadgeStatus> = {
  SUBMITTED: 'pending',
  APPROVED: 'approved',
}

export const RESULT_BADGE: Record<'PASS' | 'FAIL', StatusBadgeStatus> = {
  PASS: 'approved',
  FAIL: 'rejected',
}

// ---------- Customer Complaints ----------
export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const COMPLAINT_STATUS_BADGE: Record<ComplaintStatus, StatusBadgeStatus> = {
  open: 'open',
  in_review: 'pending',
  resolved: 'approved',
  closed: 'closed',
}

export const COMPLAINT_STATUS_OPTIONS = (
  Object.keys(COMPLAINT_STATUS_LABELS) as ComplaintStatus[]
).map(value => ({ value, label: COMPLAINT_STATUS_LABELS[value] }))

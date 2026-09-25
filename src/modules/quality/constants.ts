import type { StatusBadgeStatus } from '@/components/ui/StatusBadge'
import type { InspectionReportStatus, InspectionReportType } from '@/types/quality'

export const REPORT_TYPE_LABELS: Record<InspectionReportType, string> = {
  IPR: 'In-Process Inspection Report',
  FIR: 'Final Inspection Report',
  IIR: 'Incoming Inspection Report',
}

export const REPORT_STATUS_LABELS: Record<InspectionReportStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
}

export const REPORT_STATUS_BADGE: Record<InspectionReportStatus, StatusBadgeStatus> = {
  DRAFT: 'draft',
  SUBMITTED: 'pending',
  APPROVED: 'approved',
}

export const RESULT_BADGE: Record<'PASS' | 'FAIL', StatusBadgeStatus> = {
  PASS: 'approved',
  FAIL: 'rejected',
}

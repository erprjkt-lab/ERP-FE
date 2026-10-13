import type { ID } from './index'

export type InspectionReportType = 'IPR' | 'FIR' | 'IIR'
export type InspectionReportStatus = 'SUBMITTED' | 'APPROVED'
export type InspectionResult = 'PASS' | 'FAIL'

export interface InspectionReading {
  id: ID
  parameterId: ID
  parameterName?: string
  readingDate?: string
  measuredValue: number
  toleranceMin?: number | null
  toleranceMax?: number | null
  result: InspectionResult
}

export interface InspectionReport {
  id: ID
  reportType: InspectionReportType
  reportNumber: string
  reportDate?: string
  jobCardId?: ID
  grnId?: ID
  grnItemId?: ID
  itemId: ID
  itemName?: string
  processId?: ID
  processName?: string
  itemRevision?: string
  samplingQty?: number
  okQty?: number
  rejectedQty?: number
  attachmentPath?: string
  status: InspectionReportStatus
  approvedBy?: string | null
  approvedAt?: string | null
  readings: InspectionReading[]
  createdAt?: string
}

// ---------- Customer Complaints ----------
// status mirrors ERP-BE's CustomerComplaint constants (0..3). Resolving is not a
// direct action: filing a resolution moves a complaint to Resolved, and only a
// Resolved complaint can be closed.
export type ComplaintStatus = 'open' | 'in_review' | 'resolved' | 'closed'

export interface ComplaintResolution {
  id: string
  reportNumber: string
  actionTaken: string
  customerFeedbackReference?: string
  remark?: string
  documentUrl?: string
  resolvedByName?: string
  resolvedAt: string
}

export interface CustomerComplaint {
  id: string
  complaintNumber: string
  complaintDate: string
  partyId: string
  partyName: string
  salesInvoiceId: string | null
  invoiceNumber?: string
  itemId: string
  itemName: string
  description: string
  defectImageUrl?: string
  productReturned: boolean
  returnLocationId: string | null
  returnLocationName?: string
  batchNo?: string
  returnedQty: number | null
  /** Present once ERP-BE has credited the returned qty back into stock. */
  stockMovementId: string | null
  status: ComplaintStatus
  resolutions: ComplaintResolution[]
  createdAt: string
}

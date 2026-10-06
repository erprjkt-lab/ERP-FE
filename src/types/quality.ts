import type { ID } from './index'

export type InspectionReportType = 'IPR' | 'FIR' | 'IIR'
export type InspectionReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED'
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

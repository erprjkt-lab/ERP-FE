import type { ApiItemMaster } from './masters'
import type { ApiProcess } from './production'

// ---------- Inspection Report (shared table for IPR / FIR / IIR) ----------
// One table/lifecycle (draft -> submitted -> approved) distinguished only by
// report_type. IPR (1) and FIR (2) are created against a job card + process;
// IIR (3) is created against a GRN item and has no job_card_id/process_id —
// report_type is forced server-side on that path, never sent by the client.

export const REPORT_TYPE_IPR = 1
export const REPORT_TYPE_FIR = 2
export const REPORT_TYPE_IIR = 3

export const RESULT_PASS = 1
export const RESULT_FAIL = 2

export const REPORT_STATUS_DRAFT = 0
export const REPORT_STATUS_SUBMITTED = 1
export const REPORT_STATUS_APPROVED = 2

export interface ApiInspectionReading {
  id: number
  inspection_report_id: number
  parameter_id: number
  parameter_name: string | null
  reading_date: string | null
  inspected_by: number | null
  measured_value: number | string
  tolerance_min: number | string | null
  tolerance_max: number | string | null
  result: number
}

export interface ApiInspectionReport {
  id: number
  report_type: number
  job_card_id: number | null
  grn_id: number | null
  grn_item_id: number | null
  item_id: number
  item?: ApiItemMaster
  item_name: string | null
  report_number: string
  report_date: string | null
  process_id: number | null
  process?: ApiProcess
  process_name: string | null
  item_revision: string | null
  sampling_qty: number | null
  ok_qty: number | string | null
  rejected_qty: number | string | null
  attachment_path: string | null
  approved_by: number | null
  approved_at: string | null
  status: number
  readings?: ApiInspectionReading[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface InspectionReadingInput {
  parameter_id: number
  reading_date?: string | null
  measured_value: number
}

// Used for the job-card path (IPR when report_type=1, FIR when report_type=2).
// report_type defaults to FIR(2) server-side when omitted — always send it
// explicitly to avoid relying on that default.
export interface CreateInspectionReportPayload {
  report_type: number
  process_id: number
  report_date?: string | null
  item_revision?: string | null
  sampling_qty?: number | null
  ok_qty?: number | null
  rejected_qty?: number | null
  attachment_path?: string | null
  readings?: InspectionReadingInput[]
}

// Used for the GRN-item path (always IIR) — no process_id/report_type field,
// both are forced server-side.
export interface CreateIncomingInspectionReportPayload {
  report_date?: string | null
  item_revision?: string | null
  sampling_qty?: number | null
  ok_qty?: number | null
  rejected_qty?: number | null
  attachment_path?: string | null
  readings?: InspectionReadingInput[]
}

export type AddInspectionReadingPayload = InspectionReadingInput

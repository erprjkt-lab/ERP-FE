import type { ApiDepartment, ApiEmployee } from './hr'
import type { ApiItemMaster, ApiLocation, ApiUom } from './masters'

// ---------- Stock Requisition ----------
// Draft -> Submitted (Pending Approval) -> Approved/Rejected -> Issued -> Closed

export interface ApiStockRequisitionItem {
  id: number
  stock_requisition_id: number
  item_id: number
  item?: ApiItemMaster
  required_qty: number
  uom_id: number
  uom?: ApiUom
  pending_qty: number
  remarks: string | null
}

export interface ApiStockRequisition {
  id: number
  requisition_number: string
  requisition_date: string
  department_id: number | null
  department?: ApiDepartment
  requested_by: number | null
  requested_by_employee?: ApiEmployee
  priority: string
  status: string
  remarks: string | null
  approved_by: number | null
  approved_by_employee?: ApiEmployee
  approved_at: string | null
  items?: ApiStockRequisitionItem[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface StockRequisitionItemPayload {
  item_id: number
  required_qty: number
  uom_id: number
  remarks?: string | null
}

export interface StockRequisitionPayload {
  requisition_date?: string
  department_id?: number | null
  requested_by?: number | null
  priority?: string
  remarks?: string | null
  items?: StockRequisitionItemPayload[]
}

export interface CreateStockRequisitionPayload extends StockRequisitionPayload {
  requisition_date: string
  items: StockRequisitionItemPayload[]
}

export type UpdateStockRequisitionPayload = StockRequisitionPayload

// ---------- Stock Adjustment ----------
// Draft -> Approved (posts stock_movement) or Draft -> Cancelled. Immutable
// once created — no update endpoint, only approve/cancel/delete on a draft.

export interface ApiStockAdjustmentItem {
  id: number
  stock_adjustment_id: number
  item_id: number
  item?: ApiItemMaster
  batch_no: string | null
  heat_no: string | null
  system_qty: number
  physical_qty: number
  variance_qty: number
  remarks: string | null
}

export interface ApiStockAdjustment {
  id: number
  adjustment_number: string
  adjustment_date: string
  location_id: number
  location?: ApiLocation
  reason: string
  status: string
  remarks: string | null
  approved_by: number | null
  approved_by_employee?: ApiEmployee
  approved_at: string | null
  items?: ApiStockAdjustmentItem[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface StockAdjustmentItemPayload {
  item_id: number
  batch_no?: string | null
  heat_no?: string | null
  physical_qty: number
  remarks?: string | null
}

// system_qty/variance_qty are computed server-side from the current balance —
// the client only ever sends physical_qty.
export interface CreateStockAdjustmentPayload {
  adjustment_date: string
  location_id: number
  reason?: string | null
  remarks?: string | null
  items: StockAdjustmentItemPayload[]
}

// ---------- Stock Issue ----------
// Flat table — one row per (item, location, batch/heat) issued. A single API
// call posts multiple rows (one per `lines[]` entry) and returns them as an
// array. Two entry points: against an approved Stock Requisition line, or a
// Direct Issue (no requisition, issued straight to an employee).

export interface ApiStockIssue {
  id: number
  source: 'REQUISITION' | 'DIRECT'
  stock_requisition_item_id: number | null
  item_id: number | null
  item_name: string | null
  store_location_id: number
  store_location_name: string | null
  batch_no: string | null
  heat_no: string | null
  issued_qty: number
  issue_date: string | null
  issued_by: number | null
  issued_by_employee: string | null
  issued_to: number | null
  issued_to_employee: string | null
  stock_movement_id: number | null
  created_at: string | null
}

export interface IssueAgainstRequisitionLine {
  stock_requisition_item_id: number
  store_location_id: number
  batch_no?: string | null
  heat_no?: string | null
  issued_qty: number
}

export interface IssueAgainstRequisitionPayload {
  issue_date?: string | null
  lines: IssueAgainstRequisitionLine[]
}

export interface DirectIssueLine {
  item_id: number
  store_location_id: number
  batch_no?: string | null
  heat_no?: string | null
  issued_qty: number
}

export interface DirectIssuePayload {
  issued_to: number
  issue_date?: string | null
  lines: DirectIssueLine[]
}

export interface StockIssueFilters {
  item_id?: number
  location_id?: number
  issued_to?: number
  from_date?: string
  to_date?: string
}

// ---------- Stock Ledger (read-only report over stock_movement) ----------

export interface ApiStockMovement {
  id: number
  item_id: number
  item?: ApiItemMaster
  location_id: number
  location?: ApiLocation
  batch_no: string | null
  heat_no: string | null
  serial_no: string | null
  transaction_type: number
  transaction_type_label: string | null
  trans_id: number
  trans_item_id: number
  transaction_date: string | null
  quantity: number
  in_out: number
  rate: number | null
  reference_movement_id: number | null
  created_by: number | null
  created_at: string | null
}

export interface StockLedgerFilters {
  item_id?: number
  location_id?: number
  transaction_type?: number
  batch_no?: string
  heat_no?: string
  trans_id?: number
  from_date?: string
  to_date?: string
  per_page?: number
  page?: number
}

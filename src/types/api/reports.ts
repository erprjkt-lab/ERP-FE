/**
 * Row shapes for GET /api/v1/reports/* exactly as ERP-BE's report services serialize
 * them (app/Services/Reports, app/Http/Resources/Reports).
 *
 * Unlike the entity modules, reports have no camelCase domain twin: a report row is
 * never built, validated or submitted — it is read once and rendered into a generic
 * grid whose columns are declared by key in `reportRegistry`. Nineteen hand-written
 * mappers would buy nothing here, so the registry is the boundary instead.
 */

export interface ApiStockLedgerReportRow {
  id: number
  transaction_date: string | null
  transaction_type: string
  transaction_label: string
  direction: string
  item_id: number
  item_code: string
  item_name: string
  location_id: number | null
  location_name: string | null
  batch_no: string | null
  heat_no: string | null
  serial_no: string | null
  quantity: number
  rate: number | null
  trans_id: number | null
  trans_item_id: number | null
}

export interface ApiStockValuationReportRow {
  item_id: number
  item_code: string
  item_name: string
  location_id: number | null
  location_name: string | null
  batch_no: string | null
  qty: number
  avg_rate: number | null
  value: number
}

export interface ApiReorderReportRow {
  item_id: number
  item_code: string
  item_name: string
  location_id: number | null
  location_name: string | null
  qty: number
  reorder_level: number
  shortfall: number
}

export interface ApiStockTransferReportItem {
  item_code: string
  item_name: string
  batch_no: string | null
  qty: number
}

export interface ApiStockTransferReportRow {
  id: number
  transfer_number: string
  transfer_date: string | null
  from_location: string | null
  to_location: string | null
  total_qty: number
  line_count: number
  items: ApiStockTransferReportItem[]
}

export interface ApiOpeningVsCurrentReportRow {
  item_id: number
  item_code: string
  item_name: string
  location_id: number | null
  location_name: string | null
  opening_qty: number
  current_qty: number
  variance: number
}

export interface ApiSalesRegisterReportRow {
  id: number
  invoice_number: string
  invoice_date: string | null
  party: string | null
  status: string
  taxable_amount: number
  tax_amount: number
  net_amount: number
}

export interface ApiOrderFulfillmentReportLine {
  item_code: string
  item_name: string
  ordered_qty: number
  dispatched_qty: number
  pending_qty: number
}

export interface ApiOrderFulfillmentReportRow {
  id: number
  order_number: string
  order_date: string | null
  party: string | null
  status: string
  lines: ApiOrderFulfillmentReportLine[]
}

export interface ApiCustomerSalesSummaryReportRow {
  party_id: number
  party_name: string
  invoice_count: number
  total_net_amount: number
}

export interface ApiSalesFunnelStage {
  stage: string
  count: number
}

export interface ApiSalesFunnelReport {
  from_date: string | null
  to_date: string | null
  stages: ApiSalesFunnelStage[]
}

export interface ApiJobCardStatusReportRow {
  id: number
  job_card_number: string
  job_card_date: string | null
  target_date: string | null
  status: string
  status_label: string
  is_overdue: boolean
  days_overdue: number
  item_id: number | null
  item_code: string | null
  item_name: string | null
  party_id: number | null
  party_name: string | null
  current_process: string | null
  ordered_qty: number
  manufacturing_route: string | null
}

export interface ApiProductionOutputReportRow {
  id: number
  job_card_number: string
  ordered_qty: number
  item_code: string | null
  item_name: string | null
  received_qty: number
  received_at: string | null
}

export interface ApiRejectionReportRow {
  id: number
  job_card_number: string
  process: string | null
  reason_code: string | null
  reason: string | null
  rejected_qty: number
  review_status: string
  review_status_label: string
  created_at: string | null
}

export interface ApiOutsourceChallanReportRow {
  id: number
  job_card_number: string
  process: string | null
  requested_qty: number
  dispatched_qty: number
  consumed_qty: number
  status: string
  status_label: string
  requested_by: string | null
  requested_at: string | null
  days_pending: number
}

export interface ApiGrnRegisterReportRow {
  id: number
  grn_no: string
  grn_date: string | null
  supplier: string | null
  status: string
  status_label: string
  total_accepted_qty: number
  total_rejected_qty: number
}

export interface ApiSupplierPerformanceReportRow {
  supplier_id: number
  supplier_name: string
  grn_count: number
  total_accepted_qty: number
  total_rejected_qty: number
  rejection_rate_percent: number
}

export interface ApiPurchaseOrderStatusReportLine {
  item_code: string
  item_name: string
  ordered_qty: number
  received_qty: number
  pending_qty: number
}

export interface ApiPurchaseOrderStatusReportRow {
  id: number
  po_number: string
  po_date: string | null
  supplier: string | null
  status: string
  lines: ApiPurchaseOrderStatusReportLine[]
}

export interface ApiInspectionSummaryReportRow {
  parameter_id: number
  parameter_name: string
  total_readings: number
  pass_count: number
  fail_count: number
  pass_rate_percent: number
}

export interface ApiCustomerComplaintsReportRow {
  id: number
  complaint_number: string
  complaint_date: string | null
  party: string | null
  item_code: string | null
  item_name: string | null
  returned_qty: number
  status: string
  status_label: string
  resolutions_count: number
  last_resolved_at: string | null
}

export interface ApiAuditLogReportRow {
  document_type: string
  document_id: number
  document_number: string | null
  created_by: number | null
  created_by_name: string | null
  updated_by: number | null
  updated_by_name: string | null
  created_at: string | null
  updated_at: string | null
}

/** Every paginated report row, for the generic grid. */
export type ApiReportRow =
  | ApiStockLedgerReportRow
  | ApiStockValuationReportRow
  | ApiReorderReportRow
  | ApiStockTransferReportRow
  | ApiOpeningVsCurrentReportRow
  | ApiSalesRegisterReportRow
  | ApiOrderFulfillmentReportRow
  | ApiCustomerSalesSummaryReportRow
  | ApiJobCardStatusReportRow
  | ApiProductionOutputReportRow
  | ApiRejectionReportRow
  | ApiOutsourceChallanReportRow
  | ApiGrnRegisterReportRow
  | ApiSupplierPerformanceReportRow
  | ApiPurchaseOrderStatusReportRow
  | ApiInspectionSummaryReportRow
  | ApiCustomerComplaintsReportRow
  | ApiAuditLogReportRow

/** Filters accepted across the report endpoints; each report declares its own subset. */
export interface ReportFilters {
  item_id?: string
  location_id?: string
  from_location_id?: string
  to_location_id?: string
  party_id?: string
  supplier_id?: string
  job_card_id?: string
  status?: string
  review_status?: string
  transaction_type?: string
  document_type?: string
  overdue_only?: string
  from_date?: string
  to_date?: string
}

export type ReportFilterKey = keyof ReportFilters

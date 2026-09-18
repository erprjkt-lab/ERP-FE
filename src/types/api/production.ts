export interface ApiProcess {
  id: number
  process_name: string
  process_code: string | null
  cycle_time: number | null
  status: number
  created_at?: string | null
  created_by?: number | null
  updated_by?: number | null
}

export interface CreateProcessPayload {
  process_name: string
  process_code?: string | null
  cycle_time?: number | null
  status?: number
}

export type UpdateProcessPayload = Partial<CreateProcessPayload>

export interface ApiItemProcessRouteStep {
  id: number
  item_id: number
  process_id: number
  process_name: string | null
  sequence_no: number
  cycle_time_seconds: number | null
  is_optional: boolean
  status: number
  created_at?: string | null
  created_by?: number | null
  updated_by?: number | null
}

export interface ItemProcessRouteStepInput {
  process_id: number
  cycle_time_seconds?: number | null
  is_optional?: boolean
}

export interface ApiItemBomLine {
  id: number
  item_id: number
  component_item_id: number
  component_name: string | null
  quantity_per_unit: number
  uom_id: number
  scrap_allowance_percent: number | null
  status: number
  created_at?: string | null
  created_by?: number | null
  updated_by?: number | null
}

export interface CreateItemBomLinePayload {
  component_item_id: number
  quantity_per_unit: number
  uom_id: number
  scrap_allowance_percent?: number | null
  status?: number
}

export type UpdateItemBomLinePayload = Partial<CreateItemBomLinePayload>

export interface ApiInspectionParameter {
  id: number
  item_id: number
  item_name: string | null
  process_id: number
  process_name: string | null
  param_type: number
  parameter: string
  specification: string
  min: number | string | null
  max: number | string | null
  machine_tool: string | null
  instrument: string | null
  char_class: string | null
  size: string | null
  frequency: number | string | null
  freq_unit: 'Hrs' | 'Lot' | null
  reaction_plan: string | null
  control_method: string | null
  status: number
  created_at?: string | null
  created_by?: number | null
  updated_by?: number | null
}

export interface CreateInspectionParameterPayload {
  process_id: number
  param_type: number
  parameter: string
  specification: string
  min?: number | null
  max?: number | null
  machine_tool?: string | null
  instrument?: string | null
  char_class?: string | null
  size?: string | null
  frequency?: number | null
  freq_unit?: 'Hrs' | 'Lot' | null
  reaction_plan?: string | null
  control_method?: string | null
  status?: number
}

export type UpdateInspectionParameterPayload = Partial<CreateInspectionParameterPayload>

export interface ApiJobCard {
  id: number
  job_card_number: string
  job_card_date: string | null
  target_date: string | null
  party_id: number | null
  party_name: string | null
  item_id: number
  item_name: string | null
  item_revision: string | null
  sales_order_line_id: number | null
  plan_id: number | null
  ordered_qty: number
  manufacturing_route: number
  current_process_id: number | null
  current_process_name: string | null
  output_location_id: number
  output_location_name: string | null
  status: number
  remark: string | null
  // Only present on the single-record `show` endpoint — the list endpoint
  // does not eager-load routes.
  routes?: ApiJobCardRouteStep[]
  created_at?: string | null
  created_by?: number | null
  updated_by?: number | null
}

export interface ApiJobCardRouteStep {
  id: number
  process_id: number
  process_name: string | null
  sequence_no: number
}

export interface JobCardRouteStepInput {
  process_id: number
}

export interface ApiJobCardBomRequirement {
  id: number
  job_card_id: number
  process_id: number | null
  component_item_id: number
  component_name: string | null
  required_qty: number
  issued_qty: number
  returned_qty: number
}

export interface ApiMaterialIssue {
  id: number
  job_card_bom_requirement_id: number
  component_item_id: number | null
  component_name: string | null
  store_location_id: number
  store_location_name: string | null
  batch_no: string | null
  heat_no: string | null
  issued_qty: number
  issue_date: string | null
  issued_by: number | null
  stock_movement_id: number | null
  created_at?: string | null
}

export interface CreateMaterialIssuePayload {
  component_item_id: number
  process_id?: number | null
  store_location_id: number
  batch_no?: string | null
  heat_no?: string | null
  issued_qty: number
  issue_date?: string | null
}

export interface ApiProcessLog {
  id: number
  job_card_id: number
  process_id: number
  process_name: string | null
  previous_process_id: number | null
  performed_by_type: number
  processor_employee_id: number | null
  processor_employee_name: string | null
  processor_party_id: number | null
  processor_party_name: string | null
  operator_id: number
  operator_name: string | null
  shift_id: number
  shift_name: string | null
  log_date: string | null
  ok_qty: number
  rejected_qty: number
  bypassed_qty: number
  inbound_challan_item_id: number | null
  weight_kg: number | null
  finished_weight_kg: number | null
  conversion_ratio: number | null
  production_seconds: number | null
  downtime_seconds: number | null
  remark: string | null
  created_at?: string | null
}

export interface ApiJobCardAcceptance {
  id: number
  movement_id: number
  accepted_qty: number
  short_qty: number
  accepted_at: string | null
  accepted_by: number | null
}

export interface ApiJobCardMovement {
  id: number
  job_card_id: number
  from_process_id: number
  from_process_name: string | null
  to_process_id: number
  to_process_name: string | null
  moved_qty: number
  moved_at: string | null
  moved_by: number | null
  acceptances?: ApiJobCardAcceptance[]
}

export interface CreateMovementPayload {
  from_process_id: number
  to_process_id: number
  moved_qty: number
  moved_at?: string | null
}

export interface AcceptMovementPayload {
  accepted_qty: number
  short_qty?: number
  accepted_at?: string | null
}

export interface CreateProcessLogPayload {
  process_id: number
  previous_process_id?: number | null
  performed_by_type: number
  processor_employee_id?: number | null
  processor_party_id?: number | null
  operator_id: number
  shift_id: number
  log_date?: string | null
  ok_qty?: number
  rejected_qty?: number
  bypassed_qty?: number
  inbound_challan_item_id?: number | null
  production_seconds?: number | null
  downtime_seconds?: number | null
  remark?: string | null
}

export interface ApiJobCardChallanRequest {
  id: number
  job_card_id: number
  process_id: number
  process_name: string | null
  requested_qty: number
  dispatched_qty: number
  consumed_qty: number
  pending_qty: number
  status: number
  requested_by: number | null
  requested_by_name: string | null
  requested_at: string | null
}

export interface CreateChallanRequestPayload {
  process_id: number
  requested_qty: number
}

export interface ApiJobCardChallanItem {
  id: number
  challan_id: number
  challan_request_id: number
  job_card_id: number
  process_id: number
  process_name: string | null
  dispatched_qty: number
  received_qty: number
  outstanding_qty: number
  rate: number | string | null
  amount: number | string | null
}

export interface ApiJobCardChallan {
  id: number
  challan_number: string
  challan_date: string | null
  destination_party_id: number
  destination_party_name: string | null
  status: number
  items?: ApiJobCardChallanItem[]
}

export interface CreateChallanItemInput {
  challan_request_id: number
  dispatched_qty: number
  rate?: number | null
}

export interface CreateChallanPayload {
  challan_date?: string | null
  destination_party_id: number
  items: CreateChallanItemInput[]
}

export interface CreateJobCardPayload {
  job_card_date: string
  target_date: string
  party_id?: number | null
  item_id: number
  item_revision?: string | null
  sales_order_line_id?: number | null
  ordered_qty: number
  manufacturing_route?: number
  output_location_id: number
  remark?: string | null
  route?: JobCardRouteStepInput[]
}

export interface JobCardFilters {
  status?: number
  item_id?: number
  party_id?: number
  from_date?: string
  to_date?: string
}

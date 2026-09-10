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

export interface ApiLowStockRow {
  item_id: number
  item_name: string
  location_id: number
  qty: number
  reorder_level: number
}

export interface ApiPendingQcRow {
  id: number
  grn_no: string
  supplier: string | null
  grn_date: string | null
  days_pending: number
}

export interface ApiJobCardStageRow {
  status: string
  label: string
  count: number
}

export interface ApiOverdueJobRow {
  id: number
  job_card_number: string
  target_date: string | null
  days_overdue: number
}

export interface ApiPendingDeliveryRow {
  id: number
  order_number: string
  party: string | null
  order_date: string | null
  pending_qty: number
}

/** Only keys the logged-in employee has permission for are present. */
export interface ApiDashboardWidgets {
  low_stock?: ApiLowStockRow[]
  pending_qc?: ApiPendingQcRow[]
  job_card_stages?: ApiJobCardStageRow[]
  overdue_jobs?: ApiOverdueJobRow[]
  pending_deliveries?: ApiPendingDeliveryRow[]
}

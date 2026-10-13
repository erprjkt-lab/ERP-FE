export interface LowStockRow {
  itemId: number
  itemName: string
  locationId: number
  qty: number
  reorderLevel: number
}

export interface PendingQcRow {
  id: number
  grnNo: string
  supplier: string | null
  grnDate: string | null
  daysPending: number
}

export interface JobCardStageRow {
  status: string
  label: string
  count: number
}

export interface OverdueJobRow {
  id: number
  jobCardNumber: string
  targetDate: string | null
  daysOverdue: number
}

export interface PendingDeliveryRow {
  id: number
  orderNumber: string
  party: string | null
  orderDate: string | null
  pendingQty: number
}

export interface DashboardWidgets {
  lowStock?: LowStockRow[]
  pendingQc?: PendingQcRow[]
  jobCardStages?: JobCardStageRow[]
  overdueJobs?: OverdueJobRow[]
  pendingDeliveries?: PendingDeliveryRow[]
}

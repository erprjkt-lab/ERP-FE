import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '@/api/dashboard'
import type {
  ApiJobCardStageRow,
  ApiLowStockRow,
  ApiOverdueJobRow,
  ApiPendingDeliveryRow,
  ApiPendingQcRow,
} from '@/types/api/dashboard'
import type {
  DashboardWidgets,
  JobCardStageRow,
  LowStockRow,
  OverdueJobRow,
  PendingDeliveryRow,
  PendingQcRow,
} from '@/types/dashboard'

function toLowStockRow(api: ApiLowStockRow): LowStockRow {
  return {
    itemId: api.item_id,
    itemName: api.item_name,
    locationId: api.location_id,
    qty: Number(api.qty),
    reorderLevel: Number(api.reorder_level),
  }
}

function toPendingQcRow(api: ApiPendingQcRow): PendingQcRow {
  return {
    id: api.id,
    grnNo: api.grn_no,
    supplier: api.supplier,
    grnDate: api.grn_date,
    daysPending: api.days_pending,
  }
}

function toJobCardStageRow(api: ApiJobCardStageRow): JobCardStageRow {
  return { status: api.status, label: api.label, count: api.count }
}

function toOverdueJobRow(api: ApiOverdueJobRow): OverdueJobRow {
  return {
    id: api.id,
    jobCardNumber: api.job_card_number,
    targetDate: api.target_date,
    daysOverdue: api.days_overdue,
  }
}

function toPendingDeliveryRow(api: ApiPendingDeliveryRow): PendingDeliveryRow {
  return {
    id: api.id,
    orderNumber: api.order_number,
    party: api.party,
    orderDate: api.order_date,
    pendingQty: Number(api.pending_qty),
  }
}

export function useDashboard() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await getDashboard()).data.widgets,
  })

  const widgets: DashboardWidgets = {
    lowStock: query.data?.low_stock?.map(toLowStockRow),
    pendingQc: query.data?.pending_qc?.map(toPendingQcRow),
    jobCardStages: query.data?.job_card_stages?.map(toJobCardStageRow),
    overdueJobs: query.data?.overdue_jobs?.map(toOverdueJobRow),
    pendingDeliveries: query.data?.pending_deliveries?.map(toPendingDeliveryRow),
  }

  return {
    widgets,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

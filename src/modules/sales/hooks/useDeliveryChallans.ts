import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelDeliveryChallan,
  createDeliveryChallan,
  getDeliveryChallan,
  getDeliveryChallansForOrder,
  listDeliveryChallanItems,
} from '@/api/deliveryChallans'
import type { ItemListParams } from '@/types/api'
import type {
  ApiDeliveryChallan,
  ApiDeliveryChallanItemRow,
  ApiDeliveryChallanItem,
  ApiDeliveryChallanItemStock,
  DeliveryChallanPayload,
} from '@/types/api/sales'
import type {
  DeliveryChallan,
  DeliveryChallanItem,
  DeliveryChallanItemRow,
  DeliveryChallanItemStock,
  DeliveryChallanStatus,
} from '@/types/sales'

function toStock(api: ApiDeliveryChallanItemStock): DeliveryChallanItemStock {
  return {
    id: String(api.id),
    locationId: String(api.location_id),
    locationName: api.location_name ?? undefined,
    batchNo: api.batch_no,
    heatNo: api.heat_no,
    serialNo: api.serial_no,
    qty: Number(api.qty),
  }
}

function toItem(api: ApiDeliveryChallanItem): DeliveryChallanItem {
  return {
    id: String(api.id),
    salesOrderItemId: api.sales_order_item_id ? String(api.sales_order_item_id) : null,
    salesOrderId: api.sales_order_id ? String(api.sales_order_id) : null,
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    uomId: api.uom_id ? String(api.uom_id) : null,
    uomName: api.uom?.name,
    dispatchQty: Number(api.dispatch_qty),
    rate: Number(api.rate),
    orderRate: api.order_rate != null ? Number(api.order_rate) : null,
    discountPercent: Number(api.discount_percent ?? 0),
    discountAmount: Number(api.discount_amount ?? 0),
    taxPercent: Number(api.tax_percent ?? 0),
    taxAmount: Number(api.tax_amount ?? 0),
    lineTotal: Number(api.line_total ?? 0),
    billedQty: Number(api.billed_qty ?? 0),
    itemRemark: api.item_remark,
    stocks: (api.stocks ?? []).map(toStock),
  }
}

export function toDeliveryChallan(api: ApiDeliveryChallan): DeliveryChallan {
  const items = (api.items ?? []).map(toItem)
  return {
    id: String(api.id),
    challanNumber: api.challan_number,
    partyId: String(api.party_id),
    partyName: api.party_name ?? undefined,
    partyStateCode: api.party_state_code,
    gstin: api.gstin,
    gstType: api.gst_type,
    challanDate: api.challan_date ?? '',
    vehicleNo: api.vehicle_no,
    lrNo: api.lr_no,
    lrDate: api.lr_date,
    transporterName: api.transporter_name,
    status: api.status as DeliveryChallan['status'],
    remarks: api.remarks,
    items,
    netAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

export function useDeliveryChallan(id: string | undefined) {
  const query = useQuery({
    queryKey: ['delivery-challans', id],
    queryFn: async () => (await getDeliveryChallan(Number(id))).data,
    // select keeps the mapped object referentially stable, so form-prefill effects don't re-fire.
    select: toDeliveryChallan,
    enabled: !!id,
  })
  return { data: query.data, isLoading: query.isLoading }
}

export function useDeliveryChallansForOrder(salesOrderId: string | undefined) {
  const query = useQuery({
    queryKey: ['sales-orders', salesOrderId, 'delivery-challans'],
    queryFn: async () => (await getDeliveryChallansForOrder(Number(salesOrderId))).data,
    enabled: !!salesOrderId,
  })
  return { data: (query.data ?? []).map(toDeliveryChallan), isLoading: query.isLoading }
}

// SalesOrderItemResource doesn't expose its own dispatch_qty column, so the
// pending balance on an order line is derived here the same way the backend
// derives it: order qty minus what's been dispatched by every challan against
// it that hasn't since been cancelled (a cancel reverses the order item's
// dispatch_qty server-side).
export function useSalesOrderDispatchedQtyByItem(salesOrderId: string | undefined) {
  const { data: challans, isLoading } = useDeliveryChallansForOrder(salesOrderId)
  const dispatchedByItemId = new Map<string, number>()
  for (const challan of challans) {
    if (challan.status === 'CANCELLED') continue
    for (const item of challan.items) {
      if (!item.salesOrderItemId) continue
      dispatchedByItemId.set(
        item.salesOrderItemId,
        (dispatchedByItemId.get(item.salesOrderItemId) ?? 0) + item.dispatchQty,
      )
    }
  }
  return { challans, dispatchedByItemId, isLoading }
}

export function useCreateDeliveryChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DeliveryChallanPayload) =>
      toDeliveryChallan((await createDeliveryChallan(payload)).data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-challans'] })
      // Payload only carries sales_order_item_id, not the order id, so
      // invalidate every sales-order query rather than trying to target one.
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    },
  })
}

export function useCancelDeliveryChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toDeliveryChallan((await cancelDeliveryChallan(Number(id))).data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-challans'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    },
  })
}

function toDeliveryChallanItemRow(api: ApiDeliveryChallanItemRow): DeliveryChallanItemRow {
  return {
    id: String(api.id),
    deliveryChallanId: String(api.delivery_challan_id),
    challanNumber: api.challan_number,
    challanDate: api.challan_date,
    status: api.challan_status as DeliveryChallanStatus,
    partyId: String(api.party_id),
    partyName: api.party_name ?? undefined,
    itemId: String(api.item_id),
    itemCode: api.item_code ?? undefined,
    itemName: api.item_name ?? undefined,
    uomName: api.uom_name ?? undefined,
    dispatchQty: Number(api.dispatch_qty),
    rate: Number(api.rate),
    lineTotal: Number(api.line_total),
    billedQty: Number(api.billed_qty ?? 0),
  }
}

// Item-wise (one row per line) listing — server-side paginated.
export function useDeliveryChallanItems(params: ItemListParams = {}) {
  const query = useQuery({
    queryKey: ['delivery-challans', 'items', params],
    queryFn: () => listDeliveryChallanItems(params),
    placeholderData: keepPreviousData,
  })
  return {
    data: (query.data?.data ?? []).map(toDeliveryChallanItemRow),
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}

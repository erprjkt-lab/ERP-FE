import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelDeliveryChallan,
  createDeliveryChallan,
  getDeliveryChallan,
  listChallansForOrder,
  listDeliveryChallans,
} from '@/api/deliveryChallans'
import type { SalesListParams } from '@/api/salesEnquiries'
import type {
  ApiDeliveryChallan,
  ApiDeliveryChallanItem,
  ApiStockLine,
  DeliveryChallanPayload,
} from '@/types/api/sales'
import type { DeliveryChallan, DeliveryChallanItem, DeliveryChallanStatus } from '@/types/sales'
import { toStockLine } from './stockLine'

export interface StockLineInput {
  locationId: string
  batchNo?: string | null
  heatNo?: string | null
  serialNo?: string | null
  qty: number
}

export interface DeliveryChallanItemInput {
  salesOrderItemId?: string | null
  itemId?: string | null
  uomId?: string | null
  rate?: number | null
  discountPercent?: number | null
  taxPercent?: number | null
  itemRemark?: string | null
  stocks: StockLineInput[]
}

export interface DeliveryChallanInput {
  partyId: string
  partyStateCode?: string | null
  gstin?: string | null
  challanDate: string
  vehicleNo?: string | null
  lrNo?: string | null
  lrDate?: string | null
  transporterName?: string | null
  remarks?: string | null
  items: DeliveryChallanItemInput[]
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
    stocks: (api.stocks ?? []).map((stock: ApiStockLine) => toStockLine(stock)),
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
    status: api.status as DeliveryChallanStatus,
    remarks: api.remarks,
    items,
    netAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toPayload(input: DeliveryChallanInput): DeliveryChallanPayload {
  return {
    party_id: Number(input.partyId),
    party_state_code: input.partyStateCode ?? null,
    gstin: input.gstin ?? null,
    challan_date: input.challanDate,
    vehicle_no: input.vehicleNo ?? null,
    lr_no: input.lrNo ?? null,
    lr_date: input.lrDate ?? null,
    transporter_name: input.transporterName ?? null,
    remarks: input.remarks ?? null,
    items: input.items.map(item => {
      const stocks = item.stocks.map(stock => ({
        location_id: Number(stock.locationId),
        batch_no: stock.batchNo ?? null,
        heat_no: stock.heatNo ?? null,
        serial_no: stock.serialNo ?? null,
        qty: stock.qty,
      }))

      // A line dispatching against an order line inherits item/uom/rate from it
      // server-side. Those keys must be OMITTED rather than sent as null: the
      // backend rules are `required_without:sales_order_item_id` + integer/numeric
      // with no `nullable`, so an explicit null fails validation outright.
      if (item.salesOrderItemId) {
        return {
          sales_order_item_id: Number(item.salesOrderItemId),
          discount_percent: item.discountPercent ?? null,
          tax_percent: item.taxPercent ?? null,
          item_remark: item.itemRemark ?? null,
          stocks,
        }
      }

      return {
        item_id: item.itemId ? Number(item.itemId) : null,
        uom_id: item.uomId ? Number(item.uomId) : null,
        rate: item.rate ?? null,
        discount_percent: item.discountPercent ?? null,
        tax_percent: item.taxPercent ?? null,
        item_remark: item.itemRemark ?? null,
        stocks,
      }
    }),
  }
}

export function useDeliveryChallans(params: SalesListParams = {}) {
  const query = useQuery({
    queryKey: ['delivery-challans', params],
    queryFn: () => listDeliveryChallans(params),
    placeholderData: keepPreviousData,
  })

  return {
    data: (query.data?.data ?? []).map(toDeliveryChallan),
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}

export function useDeliveryChallan(id: string | undefined) {
  const query = useQuery({
    queryKey: ['delivery-challans', id],
    queryFn: async () => (await getDeliveryChallan(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toDeliveryChallan(query.data) : undefined,
    isLoading: query.isLoading,
    error: query.error,
  }
}

/** Every challan raised against one sales order — also the only way to work
 * out how much of each order line is still pending dispatch, since the order
 * resource doesn't expose dispatch_qty. */
export function useChallansForOrder(salesOrderId: string | undefined) {
  const query = useQuery({
    queryKey: ['delivery-challans', 'byOrder', salesOrderId],
    queryFn: async () => (await listChallansForOrder(Number(salesOrderId))).data,
    enabled: !!salesOrderId,
  })
  return { data: (query.data ?? []).map(toDeliveryChallan), isLoading: query.isLoading }
}

function invalidateChallanScope(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['delivery-challans'] })
  // Dispatching moves stock and advances the order, so both go stale.
  queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
  queryClient.invalidateQueries({ queryKey: ['stock-balance'] })
}

export function useCreateDeliveryChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: DeliveryChallanInput) =>
      toDeliveryChallan((await createDeliveryChallan(toPayload(input))).data),
    onSuccess: () => invalidateChallanScope(queryClient),
  })
}

export function useCancelDeliveryChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toDeliveryChallan((await cancelDeliveryChallan(Number(id))).data),
    onSuccess: (_result, id) => {
      invalidateChallanScope(queryClient)
      queryClient.invalidateQueries({ queryKey: ['delivery-challans', id] })
    },
  })
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveSalesOrder,
  cancelSalesOrder,
  createSalesOrder,
  createSalesOrderFromQuotation,
  deleteSalesOrder,
  getSalesOrder,
  listSalesOrders,
  updateSalesOrder,
} from '@/api/salesOrders'
import type { SalesListParams } from '@/api/salesEnquiries'
import type {
  ApiSalesOrder,
  ApiSalesOrderItem,
  SalesOrderFromQuotationPayload,
  SalesOrderPayload,
} from '@/types/api/sales'
import type { SalesOrder, SalesOrderItem, SalesOrderStatus } from '@/types/sales'

export interface SalesOrderItemInput {
  itemId: string
  uomId: string | null
  qty: number
  rate: number
  discountPercent?: number | null
  taxPercent?: number | null
  committedDate?: string | null
  itemRemark?: string | null
}

export interface SalesOrderInput {
  partyId: string
  partyStateCode?: string | null
  gstin?: string | null
  gstType?: string | null
  orderDate: string
  customerPoNo?: string | null
  customerPoDate?: string | null
  remarks?: string | null
  items: SalesOrderItemInput[]
}

function toItem(api: ApiSalesOrderItem): SalesOrderItem {
  return {
    id: String(api.id),
    salesQuotationItemId: api.sales_quotation_item_id ? String(api.sales_quotation_item_id) : null,
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    uomId: api.uom_id ? String(api.uom_id) : null,
    uomName: api.uom?.name,
    qty: Number(api.qty),
    rate: Number(api.rate),
    quotedRate: api.quoted_rate != null ? Number(api.quoted_rate) : null,
    discountPercent: Number(api.discount_percent ?? 0),
    discountAmount: Number(api.discount_amount ?? 0),
    taxPercent: Number(api.tax_percent ?? 0),
    taxAmount: Number(api.tax_amount ?? 0),
    lineTotal: Number(api.line_total ?? 0),
    committedDate: api.committed_date,
    itemRemark: api.item_remark,
  }
}

export function toSalesOrder(api: ApiSalesOrder): SalesOrder {
  const items = (api.items ?? []).map(toItem)
  return {
    id: String(api.id),
    orderNumber: api.order_number,
    salesQuotationId: api.sales_quotation_id ? String(api.sales_quotation_id) : null,
    partyId: String(api.party_id),
    partyName: api.party_name ?? undefined,
    partyStateCode: api.party_state_code,
    gstin: api.gstin,
    gstType: api.gst_type,
    orderDate: api.order_date ?? '',
    customerPoNo: api.customer_po_no,
    customerPoDate: api.customer_po_date,
    status: api.status as SalesOrderStatus,
    approvedBy: api.approved_by != null ? String(api.approved_by) : null,
    remarks: api.remarks,
    items,
    netAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toPayload(input: SalesOrderInput): SalesOrderPayload {
  return {
    party_id: Number(input.partyId),
    party_state_code: input.partyStateCode ?? null,
    gstin: input.gstin ?? null,
    gst_type: input.gstType ?? null,
    order_date: input.orderDate,
    customer_po_no: input.customerPoNo ?? null,
    customer_po_date: input.customerPoDate ?? null,
    remarks: input.remarks ?? null,
    items: input.items.map(item => ({
      item_id: Number(item.itemId),
      uom_id: item.uomId ? Number(item.uomId) : 0,
      qty: item.qty,
      rate: item.rate,
      discount_percent: item.discountPercent ?? null,
      tax_percent: item.taxPercent ?? null,
      committed_date: item.committedDate ?? null,
      item_remark: item.itemRemark ?? null,
    })),
  }
}

export function useSalesOrders(params: SalesListParams = {}) {
  const query = useQuery({
    queryKey: ['sales-orders', params],
    queryFn: () => listSalesOrders(params),
    // Keeps the previous page on screen while the next one loads, so paging
    // doesn't blank the table on every click.
    placeholderData: keepPreviousData,
  })

  return {
    data: (query.data?.data ?? []).map(toSalesOrder),
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}

export function useSalesOrder(id: string | undefined) {
  const query = useQuery({
    queryKey: ['sales-orders', id],
    queryFn: async () => (await getSalesOrder(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toSalesOrder(query.data) : undefined,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SalesOrderInput) =>
      toSalesOrder((await createSalesOrder(toPayload(input))).data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
  })
}

export function useCreateSalesOrderFromQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      quotationId,
      payload,
    }: {
      quotationId: string
      payload: SalesOrderFromQuotationPayload
    }) => toSalesOrder((await createSalesOrderFromQuotation(Number(quotationId), payload)).data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales-quotations'] })
      queryClient.invalidateQueries({ queryKey: ['sales-quotations', variables.quotationId] })
    },
  })
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SalesOrderInput }) =>
      toSalesOrder((await updateSalesOrder(Number(id), toPayload(input))).data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders', variables.id] })
    },
  })
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => deleteSalesOrder(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-orders'] }),
  })
}

export function useSalesOrderAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string
      action: 'approve' | 'cancel'
      reason?: string | null
    }) =>
      action === 'approve'
        ? toSalesOrder((await approveSalesOrder(Number(id))).data)
        : toSalesOrder((await cancelSalesOrder(Number(id), reason ?? null)).data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders', variables.id] })
    },
  })
}

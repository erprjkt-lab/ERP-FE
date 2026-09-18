import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SalesListParams } from '@/api/salesEnquiries'
import {
  cancelSalesInvoice,
  createSalesInvoice,
  createSalesInvoiceFromChallan,
  deleteSalesInvoice,
  getSalesInvoice,
  listSalesInvoices,
  postSalesInvoice,
  updateSalesInvoice,
} from '@/api/salesInvoices'
import type {
  ApiSalesInvoice,
  ApiSalesInvoiceItem,
  SalesInvoiceFromChallanPayload,
  SalesInvoicePayload,
} from '@/types/api/sales'
import type { SalesInvoice, SalesInvoiceItem, SalesInvoiceStatus } from '@/types/sales'
import type { StockLineInput } from './useDeliveryChallans'
import { toStockLine } from './stockLine'

export interface SalesInvoiceItemInput {
  itemId: string
  uomId: string | null
  rate: number
  discountPercent?: number | null
  taxPercent?: number | null
  itemRemark?: string | null
  stocks: StockLineInput[]
}

export interface SalesInvoiceInput {
  partyId: string
  partyStateCode?: string | null
  gstin?: string | null
  invoiceDate: string
  remarks?: string | null
  items: SalesInvoiceItemInput[]
}

function toItem(api: ApiSalesInvoiceItem): SalesInvoiceItem {
  return {
    id: String(api.id),
    deliveryChallanItemId: api.delivery_challan_item_id
      ? String(api.delivery_challan_item_id)
      : null,
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    uomId: api.uom_id ? String(api.uom_id) : null,
    uomName: api.uom?.name,
    qty: Number(api.qty),
    rate: Number(api.rate),
    challanRate: api.challan_rate != null ? Number(api.challan_rate) : null,
    discountPercent: Number(api.discount_percent ?? 0),
    discountAmount: Number(api.discount_amount ?? 0),
    taxPercent: Number(api.tax_percent ?? 0),
    taxAmount: Number(api.tax_amount ?? 0),
    lineTotal: Number(api.line_total ?? 0),
    itemRemark: api.item_remark,
    stocks: (api.stocks ?? []).map(toStockLine),
  }
}

export function toSalesInvoice(api: ApiSalesInvoice): SalesInvoice {
  return {
    id: String(api.id),
    invoiceNumber: api.invoice_number,
    salesOrderId: api.sales_order_id ? String(api.sales_order_id) : null,
    partyId: String(api.party_id),
    partyName: api.party_name ?? undefined,
    partyStateCode: api.party_state_code,
    gstin: api.gstin,
    gstType: api.gst_type,
    invoiceDate: api.invoice_date ?? '',
    // Unlike quotations/orders, the invoice API does roll up header totals.
    taxableAmount: Number(api.taxable_amount ?? 0),
    taxAmount: Number(api.tax_amount ?? 0),
    netAmount: Number(api.net_amount ?? 0),
    status: api.status as SalesInvoiceStatus,
    remarks: api.remarks,
    items: (api.items ?? []).map(toItem),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toPayload(input: SalesInvoiceInput): SalesInvoicePayload {
  return {
    party_id: Number(input.partyId),
    party_state_code: input.partyStateCode ?? null,
    gstin: input.gstin ?? null,
    invoice_date: input.invoiceDate,
    remarks: input.remarks ?? null,
    items: input.items.map(item => ({
      item_id: Number(item.itemId),
      uom_id: item.uomId ? Number(item.uomId) : 0,
      rate: item.rate,
      discount_percent: item.discountPercent ?? null,
      tax_percent: item.taxPercent ?? null,
      item_remark: item.itemRemark ?? null,
      stocks: item.stocks.map(stock => ({
        location_id: Number(stock.locationId),
        batch_no: stock.batchNo ?? null,
        heat_no: stock.heatNo ?? null,
        serial_no: stock.serialNo ?? null,
        qty: stock.qty,
      })),
    })),
  }
}

export function useSalesInvoices(params: SalesListParams = {}) {
  const query = useQuery({
    queryKey: ['sales-invoices', params],
    queryFn: () => listSalesInvoices(params),
    placeholderData: keepPreviousData,
  })

  return {
    data: (query.data?.data ?? []).map(toSalesInvoice),
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}

export function useSalesInvoice(id: string | undefined) {
  const query = useQuery({
    queryKey: ['sales-invoices', id],
    queryFn: async () => (await getSalesInvoice(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toSalesInvoice(query.data) : undefined,
    isLoading: query.isLoading,
    error: query.error,
  }
}

function invalidateInvoiceScope(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
  // A direct invoice moves stock; a challan-billed one updates billed_qty.
  queryClient.invalidateQueries({ queryKey: ['delivery-challans'] })
  queryClient.invalidateQueries({ queryKey: ['stock-balance'] })
}

export function useCreateSalesInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SalesInvoiceInput) =>
      toSalesInvoice((await createSalesInvoice(toPayload(input))).data),
    onSuccess: () => invalidateInvoiceScope(queryClient),
  })
}

export function useCreateSalesInvoiceFromChallan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SalesInvoiceFromChallanPayload) =>
      toSalesInvoice((await createSalesInvoiceFromChallan(payload)).data),
    onSuccess: () => invalidateInvoiceScope(queryClient),
  })
}

export function useUpdateSalesInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SalesInvoiceInput }) =>
      toSalesInvoice((await updateSalesInvoice(Number(id), toPayload(input))).data),
    onSuccess: (_result, variables) => {
      invalidateInvoiceScope(queryClient)
      queryClient.invalidateQueries({ queryKey: ['sales-invoices', variables.id] })
    },
  })
}

export function useDeleteSalesInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => deleteSalesInvoice(Number(id)),
    onSuccess: () => invalidateInvoiceScope(queryClient),
  })
}

export function useSalesInvoiceAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'post' | 'cancel' }) =>
      action === 'post'
        ? toSalesInvoice((await postSalesInvoice(Number(id))).data)
        : toSalesInvoice((await cancelSalesInvoice(Number(id))).data),
    onSuccess: (_result, variables) => {
      invalidateInvoiceScope(queryClient)
      queryClient.invalidateQueries({ queryKey: ['sales-invoices', variables.id] })
    },
  })
}

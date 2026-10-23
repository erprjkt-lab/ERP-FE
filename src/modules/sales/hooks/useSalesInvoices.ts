import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelSalesInvoice,
  createSalesInvoice,
  createSalesInvoiceFromChallan,
  deleteSalesInvoice,
  getSalesInvoice,
  listSalesInvoiceItems,
  listSalesInvoices,
  postSalesInvoice,
} from '@/api/salesInvoices'
import type { SalesInvoiceListParams } from '@/api/salesInvoices'
import type { ItemListParams } from '@/types/api'
import type {
  ApiSalesInvoice,
  ApiSalesInvoiceItem,
  ApiSalesInvoiceItemRow,
  ApiSalesInvoiceItemStock,
  SalesInvoiceFromChallanPayload,
  SalesInvoicePayload,
} from '@/types/api/sales'
import type {
  SalesInvoice,
  SalesInvoiceItem,
  SalesInvoiceItemRow,
  SalesInvoiceItemStock,
  SalesInvoiceStatus,
} from '@/types/sales'

const num = (value: number | string | null | undefined) => (value != null ? Number(value) : 0)

function toStock(api: ApiSalesInvoiceItemStock): SalesInvoiceItemStock {
  return {
    id: String(api.id),
    locationId: String(api.location_id),
    locationName: api.location_name ?? undefined,
    batchNo: api.batch_no,
    heatNo: api.heat_no,
    serialNo: api.serial_no,
    qty: num(api.qty),
  }
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
    qty: num(api.qty),
    rate: num(api.rate),
    challanRate: api.challan_rate != null ? Number(api.challan_rate) : null,
    discountPercent: num(api.discount_percent),
    discountAmount: num(api.discount_amount),
    taxPercent: num(api.tax_percent),
    taxAmount: num(api.tax_amount),
    lineTotal: num(api.line_total),
    itemRemark: api.item_remark,
    stocks: (api.stocks ?? []).map(toStock),
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
    taxableAmount: num(api.taxable_amount),
    taxAmount: num(api.tax_amount),
    netAmount: num(api.net_amount),
    status: api.status as SalesInvoiceStatus,
    remarks: api.remarks,
    items: (api.items ?? []).map(toItem),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
  }
}

export function useSalesInvoices(params: SalesInvoiceListParams = {}) {
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
    // select keeps the mapped object referentially stable for prefill effects.
    select: toSalesInvoice,
    enabled: !!id,
  })
  return { data: query.data, isLoading: query.isLoading }
}

function useInvalidateInvoices() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['sales-invoices'] })
    // Invoicing consumes challan lines (billed_qty) and moves stock.
    queryClient.invalidateQueries({ queryKey: ['delivery-challans'] })
    queryClient.invalidateQueries({ queryKey: ['stock'] })
  }
}

export function useCreateSalesInvoiceFromChallan() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: async (payload: SalesInvoiceFromChallanPayload) =>
      toSalesInvoice((await createSalesInvoiceFromChallan(payload)).data),
    onSuccess: invalidate,
  })
}

export function useCreateSalesInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: async (payload: SalesInvoicePayload) =>
      toSalesInvoice((await createSalesInvoice(payload)).data),
    onSuccess: invalidate,
  })
}

export function usePostSalesInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: async (id: string) => toSalesInvoice((await postSalesInvoice(Number(id))).data),
    onSuccess: invalidate,
  })
}

export function useCancelSalesInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: async (id: string) => toSalesInvoice((await cancelSalesInvoice(Number(id))).data),
    onSuccess: invalidate,
  })
}

export function useDeleteSalesInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: (id: string) => deleteSalesInvoice(Number(id)),
    onSuccess: invalidate,
  })
}

function toSalesInvoiceItemRow(api: ApiSalesInvoiceItemRow): SalesInvoiceItemRow {
  return {
    id: String(api.id),
    salesInvoiceId: String(api.sales_invoice_id),
    invoiceNumber: api.invoice_number,
    invoiceDate: api.invoice_date,
    status: api.invoice_status as SalesInvoiceStatus,
    partyId: String(api.party_id),
    partyName: api.party_name ?? undefined,
    itemId: String(api.item_id),
    itemCode: api.item_code ?? undefined,
    itemName: api.item_name ?? undefined,
    uomName: api.uom_name ?? undefined,
    qty: num(api.qty),
    rate: num(api.rate),
    lineTotal: num(api.line_total),
  }
}

// Item-wise (one row per line) listing — server-side paginated.
export function useSalesInvoiceItems(params: ItemListParams = {}) {
  const query = useQuery({
    queryKey: ['sales-invoices', 'items', params],
    queryFn: () => listSalesInvoiceItems(params),
    placeholderData: keepPreviousData,
  })
  return {
    data: (query.data?.data ?? []).map(toSalesInvoiceItemRow),
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}

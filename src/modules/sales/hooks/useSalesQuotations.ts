import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptSalesQuotation,
  createSalesQuotation,
  createSalesQuotationFromEnquiry,
  deleteSalesQuotation,
  getSalesQuotation,
  listSalesQuotations,
  rejectSalesQuotation,
  reviseSalesQuotation,
  sendSalesQuotation,
  updateSalesQuotation,
} from '@/api/salesQuotations'
import type { SalesListParams } from '@/api/salesEnquiries'
import type {
  ApiSalesQuotation,
  ApiSalesQuotationItem,
  SalesQuotationPayload,
} from '@/types/api/sales'
import type { SalesQuotation, SalesQuotationItem, SalesQuotationStatus } from '@/types/sales'

export interface SalesQuotationItemInput {
  salesEnquiryItemId?: string | null
  itemId: string
  uomId: string | null
  qty: number
  rate: number
  toolCost?: number | null
  gaugeCost?: number | null
  sampleCost?: number | null
  discountPercent?: number | null
  taxPercent?: number | null
  deliveryTime?: string | null
  drawingRevNo?: string | null
  itemRemark?: string | null
}

export interface SalesQuotationInput {
  salesEnquiryId?: string | null
  partyId?: string | null
  partyStateCode?: string | null
  gstin?: string | null
  gstType?: string | null
  quotationDate: string
  validUntil?: string | null
  remarks?: string | null
  items: SalesQuotationItemInput[]
}

function toItem(api: ApiSalesQuotationItem): SalesQuotationItem {
  return {
    id: String(api.id),
    salesEnquiryItemId: api.sales_enquiry_item_id ? String(api.sales_enquiry_item_id) : null,
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    uomId: api.uom_id ? String(api.uom_id) : null,
    uomName: api.uom?.name,
    qty: Number(api.qty),
    rate: Number(api.rate),
    toolCost: Number(api.tool_cost ?? 0),
    gaugeCost: Number(api.gauge_cost ?? 0),
    sampleCost: Number(api.sample_cost ?? 0),
    discountPercent: Number(api.discount_percent ?? 0),
    discountAmount: Number(api.discount_amount ?? 0),
    taxPercent: Number(api.tax_percent ?? 0),
    taxAmount: Number(api.tax_amount ?? 0),
    lineTotal: Number(api.line_total ?? 0),
    deliveryTime: api.delivery_time,
    drawingRevNo: api.drawing_rev_no,
    itemRemark: api.item_remark,
  }
}

export function toSalesQuotation(api: ApiSalesQuotation): SalesQuotation {
  const items = (api.items ?? []).map(toItem)
  return {
    id: String(api.id),
    quotationNumber: api.quotation_number,
    salesEnquiryId: api.sales_enquiry_id ? String(api.sales_enquiry_id) : null,
    partyId: String(api.party_id),
    partyName: api.party_name ?? undefined,
    partyStateCode: api.party_state_code,
    gstin: api.gstin,
    gstType: api.gst_type,
    quotationDate: api.quotation_date ?? '',
    validUntil: api.valid_until,
    revisionNo: Number(api.revision_no ?? 0),
    previousQuotationId: api.previous_quotation_id ? String(api.previous_quotation_id) : null,
    status: api.status as SalesQuotationStatus,
    remarks: api.remarks,
    items,
    netAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toPayload(input: SalesQuotationInput): SalesQuotationPayload {
  return {
    sales_enquiry_id: input.salesEnquiryId ? Number(input.salesEnquiryId) : null,
    party_id: input.partyId ? Number(input.partyId) : null,
    party_state_code: input.partyStateCode ?? null,
    gstin: input.gstin ?? null,
    gst_type: input.gstType ?? null,
    quotation_date: input.quotationDate,
    valid_until: input.validUntil ?? null,
    remarks: input.remarks ?? null,
    items: input.items.map(item => ({
      sales_enquiry_item_id: item.salesEnquiryItemId ? Number(item.salesEnquiryItemId) : null,
      item_id: Number(item.itemId),
      uom_id: item.uomId ? Number(item.uomId) : 0,
      qty: item.qty,
      rate: item.rate,
      tool_cost: item.toolCost ?? null,
      gauge_cost: item.gaugeCost ?? null,
      sample_cost: item.sampleCost ?? null,
      discount_percent: item.discountPercent ?? null,
      tax_percent: item.taxPercent ?? null,
      delivery_time: item.deliveryTime ?? null,
      drawing_rev_no: item.drawingRevNo ?? null,
      item_remark: item.itemRemark ?? null,
    })),
  }
}

export function useSalesQuotations(params: SalesListParams = {}) {
  const query = useQuery({
    queryKey: ['sales-quotations', params],
    queryFn: () => listSalesQuotations(params),
    // Keeps the previous page on screen while the next one loads, so paging
    // doesn't blank the table on every click.
    placeholderData: keepPreviousData,
  })

  return {
    data: (query.data?.data ?? []).map(toSalesQuotation),
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}

export function useSalesQuotation(id: string | undefined) {
  const query = useQuery({
    queryKey: ['sales-quotations', id],
    queryFn: async () => (await getSalesQuotation(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toSalesQuotation(query.data) : undefined,
    isLoading: query.isLoading,
    error: query.error,
  }
}

// Both create paths invalidate sales-enquiries too: quoting an enquiry flips
// it (and its lines) to QUOTED on the backend.
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['sales-quotations'] })
  queryClient.invalidateQueries({ queryKey: ['sales-enquiries'] })
}

export function useCreateSalesQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SalesQuotationInput) => {
      const payload = toPayload(input)
      const response = input.salesEnquiryId
        ? await createSalesQuotationFromEnquiry(Number(input.salesEnquiryId), payload)
        : await createSalesQuotation(payload)
      return toSalesQuotation(response.data)
    },
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useUpdateSalesQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SalesQuotationInput }) =>
      toSalesQuotation((await updateSalesQuotation(Number(id), toPayload(input))).data),
    onSuccess: (_result, variables) => {
      invalidateAll(queryClient)
      queryClient.invalidateQueries({ queryKey: ['sales-quotations', variables.id] })
    },
  })
}

export function useDeleteSalesQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => deleteSalesQuotation(Number(id)),
    onSuccess: () => invalidateAll(queryClient),
  })
}

type QuotationAction = 'send' | 'accept' | 'reject' | 'revise'

export function useSalesQuotationAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string
      action: QuotationAction
      reason?: string | null
    }) => {
      const numericId = Number(id)
      switch (action) {
        case 'send':
          return toSalesQuotation((await sendSalesQuotation(numericId)).data)
        case 'accept':
          return toSalesQuotation((await acceptSalesQuotation(numericId)).data)
        case 'reject':
          return toSalesQuotation((await rejectSalesQuotation(numericId, reason ?? null)).data)
        case 'revise':
          return toSalesQuotation((await reviseSalesQuotation(numericId)).data)
      }
    },
    onSuccess: (_result, variables) => {
      invalidateAll(queryClient)
      queryClient.invalidateQueries({ queryKey: ['sales-quotations', variables.id] })
    },
  })
}

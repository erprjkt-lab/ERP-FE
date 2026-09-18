import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeSalesEnquiry,
  createSalesEnquiry,
  deleteSalesEnquiry,
  getSalesEnquiry,
  listSalesEnquiries,
  updateSalesEnquiry,
} from '@/api/salesEnquiries'
import type { SalesListParams } from '@/api/salesEnquiries'
import type { ApiSalesEnquiry, ApiSalesEnquiryItem, SalesEnquiryPayload } from '@/types/api/sales'
import type {
  FeasibleStatus,
  SalesEnquiry,
  SalesEnquiryItem,
  SalesEnquiryItemStatus,
  SalesEnquiryStatus,
} from '@/types/sales'

export interface SalesEnquiryItemInput {
  itemId: string
  uomId: string | null
  qty: number
  annualVolume?: number | null
  drawingNo?: string | null
  processRoute?: string | null
  fgWeight?: number | null
  grossWeight?: number | null
  drawingReceived?: boolean
  feasibleStatus?: FeasibleStatus
  itemRemark?: string | null
}

export interface SalesEnquiryInput {
  enquiryDate: string
  partyId: string
  refBy?: string | null
  refNo?: string | null
  remarks?: string | null
  items: SalesEnquiryItemInput[]
}

function toItem(api: ApiSalesEnquiryItem): SalesEnquiryItem {
  return {
    id: String(api.id),
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    uomId: api.uom_id ? String(api.uom_id) : null,
    uomName: api.uom?.name,
    qty: Number(api.qty),
    annualVolume: api.annual_volume != null ? Number(api.annual_volume) : null,
    drawingNo: api.drawing_no,
    processRoute: api.process_route,
    fgWeight: api.fg_weight != null ? Number(api.fg_weight) : null,
    grossWeight: api.gross_weight != null ? Number(api.gross_weight) : null,
    drawingReceived: Boolean(api.drawing_received),
    feasibleStatus: (api.feasible_status as FeasibleStatus) ?? 'PENDING',
    itemRemark: api.item_remark,
    status: api.status as SalesEnquiryItemStatus,
  }
}

export function toSalesEnquiry(api: ApiSalesEnquiry): SalesEnquiry {
  return {
    id: String(api.id),
    enquiryNumber: api.enquiry_number,
    enquiryDate: api.enquiry_date ?? '',
    partyId: String(api.party_id),
    partyName: api.party_name ?? undefined,
    refBy: api.ref_by,
    refNo: api.ref_no,
    status: api.status as SalesEnquiryStatus,
    remarks: api.remarks,
    items: (api.items ?? []).map(toItem),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toPayload(input: SalesEnquiryInput): SalesEnquiryPayload {
  return {
    enquiry_date: input.enquiryDate,
    party_id: Number(input.partyId),
    ref_by: input.refBy ?? null,
    ref_no: input.refNo ?? null,
    remarks: input.remarks ?? null,
    items: input.items.map(item => ({
      item_id: Number(item.itemId),
      uom_id: item.uomId ? Number(item.uomId) : 0,
      qty: item.qty,
      annual_volume: item.annualVolume ?? null,
      drawing_no: item.drawingNo ?? null,
      process_route: item.processRoute ?? null,
      fg_weight: item.fgWeight ?? null,
      gross_weight: item.grossWeight ?? null,
      drawing_received: item.drawingReceived ?? false,
      feasible_status: item.feasibleStatus ?? 'PENDING',
      item_remark: item.itemRemark ?? null,
    })),
  }
}

export function useSalesEnquiries(params: SalesListParams = {}) {
  const query = useQuery({
    queryKey: ['sales-enquiries', params],
    queryFn: () => listSalesEnquiries(params),
    // Keeps the previous page on screen while the next one loads, so paging
    // doesn't blank the table on every click.
    placeholderData: keepPreviousData,
  })

  return {
    data: (query.data?.data ?? []).map(toSalesEnquiry),
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}

export function useSalesEnquiry(id: string | undefined) {
  const query = useQuery({
    queryKey: ['sales-enquiries', id],
    queryFn: async () => (await getSalesEnquiry(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toSalesEnquiry(query.data) : undefined,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function useCreateSalesEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SalesEnquiryInput) =>
      toSalesEnquiry((await createSalesEnquiry(toPayload(input))).data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-enquiries'] }),
  })
}

export function useUpdateSalesEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SalesEnquiryInput }) =>
      toSalesEnquiry((await updateSalesEnquiry(Number(id), toPayload(input))).data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['sales-enquiries', variables.id] })
    },
  })
}

export function useDeleteSalesEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => deleteSalesEnquiry(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-enquiries'] }),
  })
}

export function useCloseSalesEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => toSalesEnquiry((await closeSalesEnquiry(Number(id))).data),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['sales-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['sales-enquiries', id] })
    },
  })
}

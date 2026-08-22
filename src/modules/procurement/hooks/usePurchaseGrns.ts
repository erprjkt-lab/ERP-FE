import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelGrn, createGrn, getGrn, listGrns, saveGrnItemQc } from '@/api/purchaseGrns'
import type { ApiGrn, ApiGrnItem, GrnPayload, QcResultPayload } from '@/types/api/procurement'
import type { Grn, GrnItem, GrnLineStatus, GrnStatus } from '@/types/procurement'

export interface GrnItemInput {
  poItemId: string
  itemId: string
  gradeId?: string | null
  receivedQty: number
  commercialUnit?: string | null
  commercialQty?: number | null
  rate?: number | null
  batchNo?: string | null
  heatNo?: string | null
  serialNumbers?: string[] | null
  locationId: string
  remarks?: string
}

export interface GrnDirectInput {
  supplierId: string
  supplierDocNo?: string | null
  supplierDocDate?: string | null
  grnDate: string
  remarks?: string
  items: GrnItemInput[]
}

function toGrnItem(api: ApiGrnItem): GrnItem {
  return {
    id: String(api.id),
    grnId: String(api.grn_id),
    poItemId: String(api.po_item_id),
    itemId: String(api.item_id),
    itemName: api.item?.item_name,
    itemCode: api.item?.item_code,
    orderedQty: api.po_item ? Number(api.po_item.ordered_qty) : undefined,
    gradeId: api.grade_id ? String(api.grade_id) : null,
    receivedQty: Number(api.received_qty),
    commercialUnit: api.commercial_unit,
    commercialQty: api.commercial_qty != null ? Number(api.commercial_qty) : null,
    rate: api.rate != null ? Number(api.rate) : null,
    batchNo: api.batch_no,
    heatNo: api.heat_no,
    heatVerified: api.heat_verified,
    serialNo: api.serial_no,
    locationId: String(api.location_id),
    locationName: api.location?.name,
    acceptedQty: api.accepted_qty != null ? Number(api.accepted_qty) : null,
    rejectedQty: api.rejected_qty != null ? Number(api.rejected_qty) : null,
    shortQty: api.short_qty != null ? Number(api.short_qty) : null,
    lineStatus: api.line_status as GrnLineStatus,
    remarks: api.remark ?? undefined,
  }
}

function toGrn(api: ApiGrn): Grn {
  return {
    id: String(api.id),
    grnNo: api.grn_no,
    supplierId: String(api.supplier_id),
    supplierName: api.supplier?.party_name,
    supplierDocNo: api.supplier_doc_no,
    supplierDocDate: api.supplier_doc_date,
    grnDate: api.grn_date,
    status: api.status as GrnStatus,
    remarks: api.remark ?? undefined,
    items: (api.items ?? []).map(toGrnItem),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

export function useGrns() {
  const query = useQuery({
    queryKey: ['grns'],
    queryFn: async () => (await listGrns()).data,
  })
  return { data: (query.data ?? []).map(toGrn), isLoading: query.isLoading }
}

export function useGrn(id: string | undefined) {
  const query = useQuery({
    queryKey: ['grns', id],
    queryFn: async () => (await getGrn(Number(id))).data,
    enabled: !!id,
  })
  return { data: query.data ? toGrn(query.data) : undefined, isLoading: query.isLoading }
}

export function useCreateGrn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: GrnDirectInput) => {
      const payload: GrnPayload = {
        supplier_id: Number(input.supplierId),
        supplier_doc_no: input.supplierDocNo ?? null,
        supplier_doc_date: input.supplierDocDate ?? null,
        grn_date: input.grnDate,
        remark: input.remarks ?? null,
        items: input.items.map(item => ({
          po_item_id: Number(item.poItemId),
          item_id: Number(item.itemId),
          grade_id: item.gradeId ? Number(item.gradeId) : null,
          received_qty: item.receivedQty,
          commercial_unit: item.commercialUnit ?? null,
          commercial_qty: item.commercialQty ?? null,
          rate: item.rate ?? null,
          batch_no: item.batchNo ?? null,
          heat_no: item.heatNo ?? null,
          serial_numbers: item.serialNumbers ?? null,
          location_id: Number(item.locationId),
          remark: item.remarks ?? null,
        })),
      }
      return toGrn((await createGrn(payload)).data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grns'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

export function useCancelGrn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => toGrn((await cancelGrn(Number(id))).data),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['grns'] })
      queryClient.invalidateQueries({ queryKey: ['grns', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

export function useSaveGrnItemQc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      grnItemId,
      payload,
    }: {
      grnItemId: string
      grnId: string
      payload: QcResultPayload
    }) => toGrnItem((await saveGrnItemQc(Number(grnItemId), payload)).data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['grns'] })
      queryClient.invalidateQueries({ queryKey: ['grns', variables.grnId] })
    },
  })
}

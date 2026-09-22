import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveStockAdjustment,
  cancelStockAdjustment,
  createStockAdjustment,
  deleteStockAdjustment,
  getStockAdjustment,
  listStockAdjustments,
} from '@/api/stockAdjustments'
import type {
  ApiStockAdjustment,
  ApiStockAdjustmentItem,
  CreateStockAdjustmentPayload,
} from '@/types/api/inventory'
import type {
  StockAdjustment,
  StockAdjustmentItem,
  StockAdjustmentReason,
  StockAdjustmentStatus,
} from '@/types/inventory'

export interface StockAdjustmentItemInput {
  itemId: string
  itemCode?: string
  itemName?: string
  batchNo?: string
  heatNo?: string
  physicalQty: number
  remarks?: string
}

export interface StockAdjustmentInput {
  adjustmentDate: string
  locationId: string
  reason: StockAdjustmentReason
  remarks?: string
  items: StockAdjustmentItemInput[]
}

function toItem(api: ApiStockAdjustmentItem): StockAdjustmentItem {
  return {
    id: String(api.id),
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    batchNo: api.batch_no ?? undefined,
    heatNo: api.heat_no ?? undefined,
    systemQty: Number(api.system_qty),
    physicalQty: Number(api.physical_qty),
    varianceQty: Number(api.variance_qty),
    remarks: api.remarks ?? undefined,
  }
}

function toStockAdjustment(api: ApiStockAdjustment): StockAdjustment {
  return {
    id: String(api.id),
    adjustmentNumber: api.adjustment_number,
    adjustmentDate: api.adjustment_date,
    locationId: String(api.location_id),
    locationName: api.location?.name,
    reason: api.reason as StockAdjustmentReason,
    status: api.status as StockAdjustmentStatus,
    remarks: api.remarks ?? undefined,
    items: (api.items ?? []).map(toItem),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    approvedBy:
      api.approved_by_employee?.employee_name ??
      api.approved_by_employee?.name ??
      (api.approved_by != null ? String(api.approved_by) : null),
    approvedAt: api.approved_at,
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toCreatePayload(input: StockAdjustmentInput): CreateStockAdjustmentPayload {
  return {
    adjustment_date: input.adjustmentDate,
    location_id: Number(input.locationId),
    reason: input.reason,
    remarks: input.remarks ?? null,
    items: input.items.map(item => ({
      item_id: Number(item.itemId),
      batch_no: item.batchNo ?? null,
      heat_no: item.heatNo ?? null,
      physical_qty: item.physicalQty,
      remarks: item.remarks ?? null,
    })),
  }
}

export function useStockAdjustments() {
  const query = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: async () => (await listStockAdjustments()).data,
  })
  return { data: (query.data ?? []).map(toStockAdjustment), isLoading: query.isLoading }
}

export function useStockAdjustment(id: string | undefined) {
  const query = useQuery({
    queryKey: ['stock-adjustments', id],
    queryFn: async () => (await getStockAdjustment(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toStockAdjustment(query.data) : undefined,
    isLoading: query.isLoading,
  }
}

export function useCreateStockAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: StockAdjustmentInput) => {
      const result = await createStockAdjustment(toCreatePayload(input))
      return toStockAdjustment(result.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] }),
  })
}

function invalidateOne(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] })
  queryClient.invalidateQueries({ queryKey: ['stock-adjustments', id] })
}

export function useApproveStockAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toStockAdjustment((await approveStockAdjustment(Number(id))).data),
    onSuccess: (_result, id) => invalidateOne(queryClient, id),
  })
}

export function useCancelStockAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks?: string }) =>
      toStockAdjustment((await cancelStockAdjustment(Number(id), remarks)).data),
    onSuccess: (_result, variables) => invalidateOne(queryClient, variables.id),
  })
}

export function useDeleteStockAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStockAdjustment(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] }),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveStockRequisition,
  cancelStockRequisition,
  closeStockRequisition,
  createStockRequisition,
  deleteStockRequisition,
  getStockRequisition,
  listStockRequisitions,
  rejectStockRequisition,
  submitStockRequisition,
  updateStockRequisition,
} from '@/api/stockRequisitions'
import type {
  ApiStockRequisition,
  ApiStockRequisitionItem,
  CreateStockRequisitionPayload,
  UpdateStockRequisitionPayload,
} from '@/types/api/inventory'
import type {
  StockRequisition,
  StockRequisitionItem,
  StockRequisitionPriority,
  StockRequisitionStatus,
} from '@/types/inventory'

export interface StockRequisitionItemInput {
  itemId: string
  itemCode?: string
  itemName?: string
  requiredQty: number
  uomId: string | null
  uomName?: string
  remarks?: string
}

export interface StockRequisitionInput {
  requisitionDate: string
  departmentId?: string | null
  requestedById?: string | null
  priority: StockRequisitionPriority
  remarks?: string
  items: StockRequisitionItemInput[]
}

function toItem(api: ApiStockRequisitionItem): StockRequisitionItem {
  return {
    id: String(api.id),
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    requiredQty: Number(api.required_qty),
    uomId: String(api.uom_id),
    uomName: api.uom?.name,
    pendingQty: Number(api.pending_qty),
    remarks: api.remarks ?? undefined,
  }
}

function toStockRequisition(api: ApiStockRequisition): StockRequisition {
  return {
    id: String(api.id),
    requisitionNumber: api.requisition_number,
    requisitionDate: api.requisition_date,
    departmentId: api.department_id ? String(api.department_id) : null,
    departmentName: api.department?.name,
    requestedById: api.requested_by ? String(api.requested_by) : null,
    requestedByName: api.requested_by_employee?.employee_name ?? api.requested_by_employee?.name,
    priority: api.priority as StockRequisitionPriority,
    status: api.status as StockRequisitionStatus,
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

function toItemPayload(item: StockRequisitionItemInput) {
  return {
    item_id: Number(item.itemId),
    required_qty: item.requiredQty,
    uom_id: item.uomId ? Number(item.uomId) : 0,
    remarks: item.remarks ?? null,
  }
}

function toCreatePayload(input: StockRequisitionInput): CreateStockRequisitionPayload {
  return {
    requisition_date: input.requisitionDate,
    department_id: input.departmentId ? Number(input.departmentId) : null,
    requested_by: input.requestedById ? Number(input.requestedById) : null,
    priority: input.priority,
    remarks: input.remarks ?? null,
    items: input.items.map(toItemPayload),
  }
}

function toUpdatePayload(input: Partial<StockRequisitionInput>): UpdateStockRequisitionPayload {
  return {
    requisition_date: input.requisitionDate,
    department_id:
      input.departmentId !== undefined
        ? input.departmentId
          ? Number(input.departmentId)
          : null
        : undefined,
    requested_by:
      input.requestedById !== undefined
        ? input.requestedById
          ? Number(input.requestedById)
          : null
        : undefined,
    priority: input.priority,
    remarks: input.remarks,
    items: input.items?.map(toItemPayload),
  }
}

export function useStockRequisitions() {
  const query = useQuery({
    queryKey: ['stock-requisitions'],
    queryFn: async () => (await listStockRequisitions()).data,
  })
  return { data: (query.data ?? []).map(toStockRequisition), isLoading: query.isLoading }
}

export function useStockRequisition(id: string | undefined) {
  const query = useQuery({
    queryKey: ['stock-requisitions', id],
    queryFn: async () => (await getStockRequisition(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toStockRequisition(query.data) : undefined,
    isLoading: query.isLoading,
  }
}

export function useCreateStockRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: StockRequisitionInput) => {
      const result = await createStockRequisition(toCreatePayload(input))
      return toStockRequisition(result.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-requisitions'] }),
  })
}

export function useUpdateStockRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<StockRequisitionInput>
    }) => {
      const result = await updateStockRequisition(Number(id), toUpdatePayload(payload))
      return toStockRequisition(result.data)
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-requisitions'] })
      queryClient.invalidateQueries({ queryKey: ['stock-requisitions', variables.id] })
    },
  })
}

function invalidateOne(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  queryClient.invalidateQueries({ queryKey: ['stock-requisitions'] })
  queryClient.invalidateQueries({ queryKey: ['stock-requisitions', id] })
}

export function useSubmitStockRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toStockRequisition((await submitStockRequisition(Number(id))).data),
    onSuccess: (_result, id) => invalidateOne(queryClient, id),
  })
}

export function useApproveStockRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toStockRequisition((await approveStockRequisition(Number(id))).data),
    onSuccess: (_result, id) => invalidateOne(queryClient, id),
  })
}

export function useRejectStockRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks?: string }) =>
      toStockRequisition((await rejectStockRequisition(Number(id), remarks)).data),
    onSuccess: (_result, variables) => invalidateOne(queryClient, variables.id),
  })
}

export function useCloseStockRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toStockRequisition((await closeStockRequisition(Number(id))).data),
    onSuccess: (_result, id) => invalidateOne(queryClient, id),
  })
}

export function useCancelStockRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks?: string }) =>
      toStockRequisition((await cancelStockRequisition(Number(id), remarks)).data),
    onSuccess: (_result, variables) => invalidateOne(queryClient, variables.id),
  })
}

export function useDeleteStockRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStockRequisition(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-requisitions'] }),
  })
}

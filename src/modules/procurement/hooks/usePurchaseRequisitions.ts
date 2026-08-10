import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approvePurchaseRequisition,
  createPurchaseRequisition,
  deletePurchaseRequisition,
  getPurchaseRequisition,
  listPurchaseRequisitions,
  rejectPurchaseRequisition,
  submitPurchaseRequisition,
  updatePurchaseRequisition,
} from '@/api/purchaseRequisitions'
import type {
  ApiPurchaseRequisition,
  ApiPurchaseRequisitionItem,
  CreatePurchaseRequisitionPayload,
  UpdatePurchaseRequisitionPayload,
} from '@/types/api/procurement'
import type {
  PurchaseRequisition,
  PurchaseRequisitionItem,
  PurchaseRequisitionStatus,
  Priority,
} from '@/types/procurement'

export interface PurchaseRequisitionItemInput {
  itemId: string
  itemCode?: string
  itemName?: string
  itemDescription?: string
  requiredQty: number
  uomId: string | null
  uomName?: string
  requiredDate?: string | null
  remarks?: string
}

export interface PurchaseRequisitionInput {
  requisitionDate: string
  departmentId?: string | null
  departmentName?: string
  priority: Priority
  remarks?: string
  items: PurchaseRequisitionItemInput[]
}

function toItem(api: ApiPurchaseRequisitionItem): PurchaseRequisitionItem {
  return {
    id: String(api.id),
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    itemDescription: api.item_description ?? undefined,
    requiredQty: Number(api.required_qty),
    uomId: api.uom_id ? String(api.uom_id) : null,
    uomName: api.uom?.name,
    requiredDate: api.required_date,
    pendingQty: Number(api.pending_qty),
    remarks: api.remarks ?? undefined,
  }
}

function toPurchaseRequisition(api: ApiPurchaseRequisition): PurchaseRequisition {
  return {
    id: String(api.id),
    requisitionNumber: api.requisition_number,
    requisitionDate: api.requisition_date,
    departmentId: api.department_id ? String(api.department_id) : null,
    departmentName: api.department?.name,
    priority: api.priority as Priority,
    status: api.status as PurchaseRequisitionStatus,
    remarks: api.remarks ?? undefined,
    items: (api.items ?? []).map(toItem),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    approvedBy:
      api.approved_by_employee?.name ?? (api.approved_by != null ? String(api.approved_by) : null),
    approvedAt: api.approved_at,
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toItemPayload(item: PurchaseRequisitionItemInput) {
  return {
    item_id: Number(item.itemId),
    item_description: item.itemDescription ?? null,
    required_qty: item.requiredQty,
    uom_id: item.uomId ? Number(item.uomId) : 0,
    required_date: item.requiredDate ?? null,
    remarks: item.remarks ?? null,
  }
}

function toCreatePayload(input: PurchaseRequisitionInput): CreatePurchaseRequisitionPayload {
  return {
    requisition_date: input.requisitionDate,
    department_id: input.departmentId ? Number(input.departmentId) : null,
    priority: input.priority,
    remarks: input.remarks ?? null,
    items: input.items.map(toItemPayload),
  }
}

function toUpdatePayload(
  input: Partial<PurchaseRequisitionInput>,
): UpdatePurchaseRequisitionPayload {
  return {
    requisition_date: input.requisitionDate,
    department_id:
      input.departmentId !== undefined
        ? input.departmentId
          ? Number(input.departmentId)
          : null
        : undefined,
    priority: input.priority,
    remarks: input.remarks,
    items: input.items?.map(toItemPayload),
  }
}

export function usePurchaseRequisitions() {
  const query = useQuery({
    queryKey: ['purchase-requisitions'],
    queryFn: async () => (await listPurchaseRequisitions()).data,
  })
  return { data: (query.data ?? []).map(toPurchaseRequisition), isLoading: query.isLoading }
}

export function usePurchaseRequisition(id: string | undefined) {
  const query = useQuery({
    queryKey: ['purchase-requisitions', id],
    queryFn: async () => (await getPurchaseRequisition(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toPurchaseRequisition(query.data) : undefined,
    isLoading: query.isLoading,
  }
}

export function useCreatePurchaseRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PurchaseRequisitionInput) => {
      const result = await createPurchaseRequisition(toCreatePayload(input))
      return toPurchaseRequisition(result.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] }),
  })
}

export function useUpdatePurchaseRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<PurchaseRequisitionInput>
    }) => {
      const result = await updatePurchaseRequisition(Number(id), toUpdatePayload(payload))
      return toPurchaseRequisition(result.data)
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions', variables.id] })
    },
  })
}

export function useSubmitRequisitionForApproval() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toPurchaseRequisition((await submitPurchaseRequisition(Number(id))).data),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions', id] })
    },
  })
}

export function useApproveRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toPurchaseRequisition((await approvePurchaseRequisition(Number(id))).data),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions', id] })
    },
  })
}

export function useRejectRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      toPurchaseRequisition((await rejectPurchaseRequisition(Number(id), reason)).data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions', variables.id] })
    },
  })
}

export function useDeletePurchaseRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePurchaseRequisition(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] }),
  })
}

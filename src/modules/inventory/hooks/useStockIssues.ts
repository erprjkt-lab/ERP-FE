import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDirectStockIssue,
  issueAgainstRequisition,
  listAllStockIssues,
  listStockIssuesForRequisition,
} from '@/api/stockIssues'
import type {
  ApiStockIssue,
  DirectIssuePayload,
  IssueAgainstRequisitionPayload,
  StockIssueFilters,
} from '@/types/api/inventory'
import type { StockIssue } from '@/types/inventory'

function toIssue(api: ApiStockIssue): StockIssue {
  return {
    id: String(api.id),
    source: api.source,
    stockRequisitionItemId: api.stock_requisition_item_id
      ? String(api.stock_requisition_item_id)
      : undefined,
    itemId: api.item_id ? String(api.item_id) : undefined,
    itemName: api.item_name ?? undefined,
    storeLocationId: String(api.store_location_id),
    storeLocationName: api.store_location_name ?? undefined,
    batchNo: api.batch_no ?? undefined,
    heatNo: api.heat_no ?? undefined,
    issuedQty: Number(api.issued_qty),
    issueDate: api.issue_date ?? undefined,
    issuedByName: api.issued_by_employee ?? undefined,
    issuedToId: api.issued_to ? String(api.issued_to) : undefined,
    issuedToName: api.issued_to_employee ?? undefined,
    createdAt: api.created_at ?? undefined,
  }
}

export function useStockIssuesForRequisition(requisitionId: string | undefined) {
  const query = useQuery({
    queryKey: ['stock-requisitions', requisitionId, 'issues'],
    queryFn: async () => (await listStockIssuesForRequisition(Number(requisitionId))).data,
    enabled: !!requisitionId,
  })
  return { data: (query.data ?? []).map(toIssue), isLoading: query.isLoading }
}

export function useIssueAgainstRequisition(requisitionId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: IssueAgainstRequisitionPayload) =>
      (await issueAgainstRequisition(Number(requisitionId), payload)).data.map(toIssue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-requisitions', requisitionId, 'issues'] })
      queryClient.invalidateQueries({ queryKey: ['stock-requisitions', requisitionId] })
      queryClient.invalidateQueries({ queryKey: ['stock-requisitions'] })
      queryClient.invalidateQueries({ queryKey: ['stock-issues'] })
    },
  })
}

export function useAllStockIssues(filters: StockIssueFilters = {}) {
  const query = useQuery({
    queryKey: ['stock-issues', filters],
    queryFn: async () => (await listAllStockIssues(filters)).data,
  })
  return { data: (query.data ?? []).map(toIssue), isLoading: query.isLoading }
}

export function useCreateDirectStockIssue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DirectIssuePayload) =>
      (await createDirectStockIssue(payload)).data.map(toIssue),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stock-issues'] }),
  })
}

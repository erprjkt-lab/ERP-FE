import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMaterialIssue,
  createMaterialReturn,
  deleteMaterialIssue,
  deleteMaterialReturn,
  getMaterialSummary,
  listBomRequirements,
  listMaterialIssues,
  listMaterialReturns,
} from '@/api/jobCardMaterials'
import type {
  ApiJobCardBomRequirement,
  ApiMaterialIssue,
  ApiMaterialReturn,
  ApiMaterialSummaryRow,
  CreateMaterialIssuePayload,
  CreateMaterialReturnPayload,
} from '@/types/api/production'
import type {
  JobCardBomRequirement,
  MaterialIssue,
  MaterialReturn,
  MaterialSummaryRow,
} from '@/types/production'

function toRequirement(api: ApiJobCardBomRequirement): JobCardBomRequirement {
  return {
    id: String(api.id),
    componentItemId: String(api.component_item_id),
    componentName: api.component_name ?? '',
    requiredQty: Number(api.required_qty),
    issuedQty: Number(api.issued_qty),
    returnedQty: Number(api.returned_qty),
  }
}

function toIssue(api: ApiMaterialIssue): MaterialIssue {
  return {
    id: String(api.id),
    componentItemId: api.component_item_id ? String(api.component_item_id) : undefined,
    componentName: api.component_name ?? '',
    storeLocationId: String(api.store_location_id),
    storeLocationName: api.store_location_name ?? '',
    batchNo: api.batch_no ?? undefined,
    heatNo: api.heat_no ?? undefined,
    issuedQty: Number(api.issued_qty),
    issueDate: api.issue_date ?? '',
  }
}

/** Requirement rows are created lazily by the first issue, so this is empty
 * until material has actually been issued — the planned requirement is
 * derived from the item's BOM instead (see JobCardDetail). */
export function useBomRequirements(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'bomRequirements', jobCardId],
    queryFn: async () => (await listBomRequirements(Number(jobCardId))).data.map(toRequirement),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useMaterialIssues(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'materialIssues', jobCardId],
    queryFn: async () => (await listMaterialIssues(Number(jobCardId))).data.map(toIssue),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useIssueMaterial(jobCardId: string | undefined) {
  const invalidate = useMaterialInvalidation(jobCardId)
  return useMutation({
    mutationFn: async (payload: CreateMaterialIssuePayload) =>
      (await createMaterialIssue(Number(jobCardId), payload)).data.map(toIssue),
    onSuccess: invalidate,
  })
}

function toSummaryRow(api: ApiMaterialSummaryRow): MaterialSummaryRow {
  return {
    componentItemId: String(api.component_item_id),
    componentName: api.component_name ?? '',
    componentCode: api.component_code ?? '',
    requiredQty: Number(api.required_qty),
    issuedQty: Number(api.issued_qty),
    usedQty: Number(api.used_qty),
    returnedQty: Number(api.returned_qty),
    pendingUsedQty: Number(api.pending_used_qty),
  }
}

function toReturn(api: ApiMaterialReturn): MaterialReturn {
  return {
    id: String(api.id),
    componentItemId: api.component_item_id ? String(api.component_item_id) : undefined,
    componentName: api.component_name ?? '',
    storeLocationId: String(api.store_location_id),
    storeLocationName: api.store_location_name ?? '',
    batchNo: api.batch_no ?? undefined,
    heatNo: api.heat_no ?? undefined,
    returnedQty: Number(api.returned_qty),
    returnDate: api.return_date ?? '',
  }
}

/** Server-side required/issued/used/returned/pending per component. Like
 *  requirement rows it is empty until something has been issued. */
export function useMaterialSummary(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'materialSummary', jobCardId],
    queryFn: async () => (await getMaterialSummary(Number(jobCardId))).data.map(toSummaryRow),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

export function useMaterialReturns(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'materialReturns', jobCardId],
    queryFn: async () => (await listMaterialReturns(Number(jobCardId))).data.map(toReturn),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

// Every material write moves stock and shifts the used/pending split, so they
// all invalidate the same four lists.
function useMaterialInvalidation(jobCardId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    for (const key of ['bomRequirements', 'materialIssues', 'materialReturns', 'materialSummary']) {
      queryClient.invalidateQueries({ queryKey: ['production', key, jobCardId] })
    }
    // Issuing/returning moves real stock, so the store views have to refetch.
    queryClient.invalidateQueries({ queryKey: ['stock-balance'] })
    queryClient.invalidateQueries({ queryKey: ['stock-ledger'] })
  }
}

export function useReturnMaterial(jobCardId: string | undefined) {
  const invalidate = useMaterialInvalidation(jobCardId)
  return useMutation({
    mutationFn: async (payload: CreateMaterialReturnPayload) =>
      toReturn((await createMaterialReturn(Number(jobCardId), payload)).data),
    onSuccess: invalidate,
  })
}

export function useDeleteMaterialReturn(jobCardId: string | undefined) {
  const invalidate = useMaterialInvalidation(jobCardId)
  return useMutation({
    mutationFn: (returnId: string) => deleteMaterialReturn(Number(returnId)),
    onSuccess: invalidate,
  })
}

export function useDeleteMaterialIssue(jobCardId: string | undefined) {
  const invalidate = useMaterialInvalidation(jobCardId)
  return useMutation({
    mutationFn: (issueId: string) => deleteMaterialIssue(Number(issueId)),
    onSuccess: invalidate,
  })
}

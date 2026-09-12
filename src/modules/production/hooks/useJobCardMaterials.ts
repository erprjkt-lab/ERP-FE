import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMaterialIssue,
  listBomRequirements,
  listMaterialIssues,
} from '@/api/jobCardMaterials'
import type {
  ApiJobCardBomRequirement,
  ApiMaterialIssue,
  CreateMaterialIssuePayload,
} from '@/types/api/production'
import type { JobCardBomRequirement, MaterialIssue } from '@/types/production'

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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMaterialIssuePayload) =>
      createMaterialIssue(Number(jobCardId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production', 'bomRequirements', jobCardId] })
      queryClient.invalidateQueries({ queryKey: ['production', 'materialIssues', jobCardId] })
    },
  })
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createItemCategory,
  deleteItemCategory,
  listItemCategories,
  updateItemCategory,
} from '@/api/itemCategories'
import type {
  ApiItemCategory,
  CreateItemCategoryPayload,
  UpdateItemCategoryPayload,
} from '@/types/api/masters'
import type { ItemCategory } from '@/types/masters'

/** No-arg calls keep the old single-fetch behaviour for dropdowns. */
export function useItemCategories(page = 1, perPage = 200, enabled = true) {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'itemCategories', page, perPage],
    queryFn: () => listItemCategories(page, perPage),
    placeholderData: keepPreviousData,
    enabled,
  })
  return { data: data?.data ?? [], meta: data?.meta, isLoading }
}

function toItemCategory(api: ApiItemCategory, byId: Map<number, ApiItemCategory>): ItemCategory {
  return {
    id: String(api.id),
    name: api.name,
    code: api.code ?? undefined,
    parentId: api.parent_id ? String(api.parent_id) : null,
    parentName: api.parent_id ? byId.get(api.parent_id)?.name : undefined,
    isFinal: api.is_final,
    status: api.status === 0 ? 'inactive' : 'active',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

// Mapped-to-FE-shape list for the Item Category master screen, distinct from
// the raw `useItemCategories()` above which dropdown consumers (Raw Material/
// Finished Good forms etc.) already depend on for its ApiItemCategory shape.
/** Deliberately unpaged: each row shows its parent's *name*, resolved from the
 *  rows in hand (ERP-BE's ItemCategoryResource returns parent_id only). Paging
 *  would blank the parent of any category whose parent sits on another page.
 *  Page it once that resource carries parent_name. */
export function useItemCategoryList() {
  const { data: categories, isLoading } = useItemCategories()
  const byId = new Map(categories.map(c => [c.id, c]))
  return { data: categories.map(c => toItemCategory(c, byId)), isLoading }
}

export function useCreateItemCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateItemCategoryPayload) => createItemCategory(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'itemCategories'] }),
  })
}

export function useUpdateItemCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemCategoryPayload }) =>
      updateItemCategory(Number(id), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'itemCategories'] }),
  })
}

export function useDeleteItemCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteItemCategory(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'itemCategories'] }),
  })
}

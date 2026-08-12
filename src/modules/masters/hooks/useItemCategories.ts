import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useItemCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'itemCategories'],
    queryFn: listItemCategories,
    staleTime: Infinity,
  })
  return { data: data?.data ?? [], isLoading }
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

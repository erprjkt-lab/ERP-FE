import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPermission, deletePermission, listPermissions } from '@/api/permissions'
import type { CreatePermissionPayload } from '@/types/api/rbac'

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => (await listPermissions()).data,
  })
}

export function useCreatePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) => createPermission(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] }),
  })
}

export function useDeletePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePermission(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permissions'] }),
  })
}

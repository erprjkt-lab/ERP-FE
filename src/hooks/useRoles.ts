import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRole, deleteRole, listRoles, syncRolePermissions, updateRole } from '@/api/roles'
import type {
  CreateRolePayload,
  SyncRolePermissionsPayload,
  UpdateRolePayload,
} from '@/types/api/rbac'

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await listRoles()).data,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRolePayload }) =>
      updateRole(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useSyncRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SyncRolePermissionsPayload }) =>
      syncRolePermissions(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

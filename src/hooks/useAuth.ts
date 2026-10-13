import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { login, logout, me } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { usePermissionStore } from '@/store/permissionStore'
import type { LoginPayload } from '@/types/api/auth'

export function useMe() {
  const token = useAuthStore(state => state.token)
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await me()
      if (data) {
        usePermissionStore.getState().setUserRoles(data.roles ?? [])
        usePermissionStore.getState().setUserPermissions(data.permissions ?? [])
      }
      return data
    },
    enabled: !!token,
  })
}

export function useLogin() {
  const setToken = useAuthStore(state => state.setToken)
  const setUser = useAuthStore(state => state.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async response => {
      setToken(response.data.token)
      if (response.data.employee) {
        setUser(response.data.employee)
        usePermissionStore.getState().setUserRoles(response.data.employee.roles ?? [])
        usePermissionStore.getState().setUserPermissions(response.data.employee.permissions ?? [])
      }
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useLogout() {
  const clear = useAuthStore(state => state.clear)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clear()
      usePermissionStore.getState().clearPermissions()
      queryClient.clear()
    },
  })
}

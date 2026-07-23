import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { login, logout, me } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { LoginPayload } from '@/types/api/auth'

export function useMe() {
  const token = useAuthStore(state => state.token)
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await me()).data,
    enabled: !!token,
  })
}

export function useLogin() {
  const setToken = useAuthStore(state => state.setToken)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async response => {
      setToken(response.data.token)
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
      queryClient.clear()
    },
  })
}

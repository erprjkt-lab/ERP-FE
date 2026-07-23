import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMenu, deleteMenu, getSidebarMenu, listMenus, updateMenu } from '@/api/menus'
import type { CreateMenuPayload, UpdateMenuPayload } from '@/types/api/rbac'

export function useSidebarMenu() {
  return useQuery({
    queryKey: ['menus', 'sidebar'],
    queryFn: async () => (await getSidebarMenu()).data,
  })
}

export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: async () => (await listMenus()).data,
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMenuPayload) => createMenu(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menus'] }),
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMenuPayload }) =>
      updateMenu(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menus'] }),
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMenu(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menus'] }),
  })
}

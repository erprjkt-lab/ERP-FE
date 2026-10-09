import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMenu, deleteMenu, getSidebarMenu, listMenus, updateMenu } from '@/api/menus'
import { usePermissionStore } from '@/store/permissionStore'
import type { CreateMenuPayload, UpdateMenuPayload } from '@/types/api/rbac'

export function useSidebarMenu() {
  const setSidebarData = usePermissionStore(state => state.setSidebarData)
  const storeNodes = usePermissionStore(state => state.sidebarTree)
  const isLoaded = usePermissionStore(state => state.isLoaded)

  return useQuery({
    queryKey: ['menus', 'sidebar'],
    queryFn: async () => {
      const { data } = await getSidebarMenu()
      setSidebarData(data)
      return data
    },
    initialData: isLoaded && storeNodes.length > 0 ? storeNodes : undefined,
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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'sidebar'] })
      await usePermissionStore.getState().refreshPermissions()
    },
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateMenuPayload }) =>
      updateMenu(id, payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'sidebar'] })
      await usePermissionStore.getState().refreshPermissions()
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMenu(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'sidebar'] })
      await usePermissionStore.getState().refreshPermissions()
    },
  })
}

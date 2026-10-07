import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getEmployeeMenus, grantEmployeeMenuPermissions } from '@/api/employees'
import type { GrantMenuPermissionsBulkPayload } from '@/types/api/rbac'
import { toPermissionRows } from '../utils/menuPermissions'

export function useEmployeeMenuPermissions(employeeId: string | undefined) {
  const query = useQuery({
    queryKey: ['employees', employeeId, 'menus'],
    queryFn: async () => (await getEmployeeMenus(Number(employeeId))).data,
    enabled: !!employeeId,
  })

  return {
    data: query.data ? toPermissionRows(query.data) : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
  }
}

export function useSaveEmployeeMenuPermissions(employeeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: GrantMenuPermissionsBulkPayload) =>
      grantEmployeeMenuPermissions(Number(employeeId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId, 'menus'] })
      // The saved employee may be the logged-in one, whose sidebar is permission-driven.
      queryClient.invalidateQueries({ queryKey: ['menus', 'sidebar'] })
    },
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '@/api/departments'
import type { CreateDepartmentPayload, UpdateDepartmentPayload } from '@/types/api/hr'
import type { ApiDepartment } from '@/types/api/hr'
import type { Department } from '@/types/hr'

function toDepartment(api: ApiDepartment): Department {
  return {
    id: String(api.id),
    name: api.name,
    code: api.name.trim().slice(0, 3).toUpperCase(),
    managerId: null,
    parentId: null,
    headCount: 0,
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await listDepartments()).data.map(toDepartment),
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDepartmentPayload }) =>
      updateDepartment(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })
}

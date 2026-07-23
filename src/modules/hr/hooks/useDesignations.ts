import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDesignation,
  deleteDesignation,
  listDesignations,
  updateDesignation,
} from '@/api/designations'
import type { CreateDesignationPayload, UpdateDesignationPayload } from '@/types/api/hr'
import type { Designation } from '@/types/hr'
import { useHRLocalStore } from '../store/hrLocalStore'
import { useDepartments } from './useDepartments'

export function useDesignations() {
  const designationExtras = useHRLocalStore(state => state.designationExtras)
  const departmentsQuery = useDepartments()
  const query = useQuery({
    queryKey: ['designations'],
    queryFn: async () => (await listDesignations()).data,
  })

  const departmentsById = new Map((departmentsQuery.data ?? []).map(d => [d.id, d]))

  const data: Designation[] | undefined = query.data?.map(api => {
    const id = String(api.id)
    const departmentId = designationExtras[id]?.departmentId ?? null
    return {
      id,
      title: api.name,
      level: 0,
      departmentId,
      department: departmentId ? departmentsById.get(departmentId) : undefined,
      createdAt: api.created_at ?? '',
      updatedAt: api.created_at ?? '',
    }
  })

  return { ...query, data, isLoading: query.isLoading || departmentsQuery.isLoading }
}

export function useCreateDesignation() {
  const queryClient = useQueryClient()
  const setDesignationExtra = useHRLocalStore(state => state.setDesignationExtra)
  return useMutation({
    mutationFn: async ({
      payload,
      departmentId,
    }: {
      payload: CreateDesignationPayload
      departmentId: string | null
    }) => {
      const result = await createDesignation(payload)
      setDesignationExtra(String(result.data.id), { departmentId })
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] }),
  })
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient()
  const setDesignationExtra = useHRLocalStore(state => state.setDesignationExtra)
  return useMutation({
    mutationFn: async ({
      id,
      payload,
      departmentId,
    }: {
      id: number
      payload: UpdateDesignationPayload
      departmentId: string | null
    }) => {
      const result = await updateDesignation(id, payload)
      setDesignationExtra(String(id), { departmentId })
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] }),
  })
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient()
  const removeDesignationExtra = useHRLocalStore(state => state.removeDesignationExtra)
  return useMutation({
    mutationFn: async (id: number) => {
      await deleteDesignation(id)
      removeDesignationExtra(String(id))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['designations'] }),
  })
}

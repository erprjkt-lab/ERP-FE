import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createMaterialGrade,
  deleteMaterialGrade,
  listMaterialGrades,
  updateMaterialGrade,
} from '@/api/materialGrades'
import type {
  ApiMaterialGrade,
  CreateMaterialGradePayload,
  UpdateMaterialGradePayload,
} from '@/types/api/masters'
import type { MaterialGrade } from '@/types/masters'

export function useMaterialGrades() {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'materialGrades'],
    queryFn: listMaterialGrades,
    staleTime: Infinity,
  })
  return { data: data?.data ?? [], isLoading }
}

function toMaterialGrade(api: ApiMaterialGrade): MaterialGrade {
  return {
    id: String(api.id),
    materialGrade: api.material_grade,
    materialType: api.material_type ?? undefined,
    standard: api.standard ?? undefined,
    specification: api.specification ?? undefined,
    status: api.status === 0 ? 'inactive' : 'active',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

// Mapped-to-FE-shape list for the Material Grade master screen, distinct from
// the raw `useMaterialGrades()` above which dropdown consumers (Raw Material/
// Finished Good forms etc.) already depend on for its ApiMaterialGrade shape.
export function useMaterialGradeList() {
  const { data: materialGrades, isLoading } = useMaterialGrades()
  return { data: materialGrades.map(toMaterialGrade), isLoading }
}

export function useCreateMaterialGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMaterialGradePayload) => createMaterialGrade(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'materialGrades'] }),
  })
}

export function useUpdateMaterialGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialGradePayload }) =>
      updateMaterialGrade(Number(id), payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'materialGrades'] }),
  })
}

export function useDeleteMaterialGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMaterialGrade(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masters', 'materialGrades'] }),
  })
}

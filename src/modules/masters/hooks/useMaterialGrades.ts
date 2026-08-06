import { useQuery } from '@tanstack/react-query'
import { listMaterialGrades } from '@/api/materialGrades'

export function useMaterialGrades() {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'materialGrades'],
    queryFn: listMaterialGrades,
    staleTime: Infinity,
  })
  return { data: data?.data ?? [], isLoading }
}

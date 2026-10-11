import { useQuery } from '@tanstack/react-query'
import { listUoms } from '@/api/uom'
import { FALLBACK_UOMS } from '../constants'

export function useUoms() {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'uoms'],
    queryFn: listUoms,
    staleTime: Infinity,
  })
  const uoms = data?.data ?? []
  return { data: uoms.length ? uoms : FALLBACK_UOMS, isLoading }
}

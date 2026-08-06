import { useQuery } from '@tanstack/react-query'
import { listUoms } from '@/api/uom'

export function useUoms() {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'uoms'],
    queryFn: listUoms,
    staleTime: Infinity,
  })
  return { data: data?.data ?? [], isLoading }
}

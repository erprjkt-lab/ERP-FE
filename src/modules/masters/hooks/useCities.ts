import { useQuery } from '@tanstack/react-query'
import { listCities } from '@/api/world'

export function useCities(stateId?: string | null) {
  const numericStateId = stateId ? Number(stateId) : undefined
  const { data, isLoading } = useQuery({
    queryKey: ['world', 'cities', numericStateId],
    queryFn: () => listCities(numericStateId as number),
    enabled: numericStateId !== undefined,
    staleTime: Infinity,
  })
  return { data: data?.data ?? [], isLoading }
}

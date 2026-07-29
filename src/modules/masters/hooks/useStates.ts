import { useQuery } from '@tanstack/react-query'
import { listStates } from '@/api/world'

export function useStates(countryId?: string | null) {
  const numericCountryId = countryId ? Number(countryId) : undefined
  const { data, isLoading } = useQuery({
    queryKey: ['world', 'states', numericCountryId],
    queryFn: () => listStates(numericCountryId as number),
    enabled: numericCountryId !== undefined,
    staleTime: Infinity,
  })
  return { data: data?.data ?? [], isLoading }
}

import { useQuery } from '@tanstack/react-query'
import { listCountries } from '@/api/world'

export function useCountries() {
  const { data, isLoading } = useQuery({
    queryKey: ['world', 'countries'],
    queryFn: listCountries,
    staleTime: Infinity,
  })
  return { data: data?.data ?? [], isLoading }
}

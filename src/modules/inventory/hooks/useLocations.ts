import { useQuery } from '@tanstack/react-query'
import { listLocations } from '@/api/locations'
import type { ApiLocation } from '@/types/api/masters'

export interface LocationOption {
  id: string
  code: string
  name: string
  isActive: boolean
}

function toLocation(api: ApiLocation): LocationOption {
  return { id: String(api.id), code: api.code, name: api.name, isActive: api.is_active }
}

export function useLocations() {
  const query = useQuery({
    queryKey: ['locations'],
    queryFn: async () => (await listLocations()).data,
    staleTime: 5 * 60 * 1000,
  })
  return { data: (query.data ?? []).map(toLocation), isLoading: query.isLoading }
}

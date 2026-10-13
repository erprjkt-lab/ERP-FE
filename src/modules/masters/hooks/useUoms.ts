import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listUoms } from '@/api/uom'

/** No-arg calls keep the single fetch the UOM dropdowns rely on. */
export function useUoms(page = 1, perPage = 200) {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'uoms', page, perPage],
    queryFn: () => listUoms(page, perPage),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  })
  return { data: data?.data ?? [], meta: data?.meta, isLoading }
}

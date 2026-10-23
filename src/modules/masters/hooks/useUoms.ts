import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listUoms } from '@/api/uom'

/** No-arg calls keep the single fetch the UOM dropdowns rely on. */
export function useUoms(page = 1, perPage = 200, enabled = true) {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'uoms', page, perPage],
    queryFn: () => listUoms(page, perPage),
    placeholderData: keepPreviousData,
    enabled,
  })
  return { data: data?.data ?? [], meta: data?.meta, isLoading }
}

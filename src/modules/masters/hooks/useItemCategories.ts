import { useQuery } from '@tanstack/react-query'
import { listItemCategories } from '@/api/itemCategories'

export function useItemCategories() {
  const { data, isLoading } = useQuery({
    queryKey: ['masters', 'itemCategories'],
    queryFn: listItemCategories,
    staleTime: Infinity,
  })
  return { data: data?.data ?? [], isLoading }
}

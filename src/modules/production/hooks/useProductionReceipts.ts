import { useQuery } from '@tanstack/react-query'
import { listProductionReceipts } from '@/api/productionReceipts'
import type { ApiProductionReceipt } from '@/types/api/production'
import type { ProductionReceipt } from '@/types/production'

function toReceipt(api: ApiProductionReceipt): ProductionReceipt {
  return {
    id: String(api.id),
    itemName: api.item_name ?? '',
    storeLocationId: String(api.store_location_id),
    storeLocationName: api.store_location_name ?? '',
    receivedQty: Number(api.received_qty),
    receivedAt: api.received_at ?? '',
  }
}

export function useProductionReceipts(jobCardId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['production', 'productionReceipts', jobCardId],
    queryFn: async () => (await listProductionReceipts(Number(jobCardId))).data.map(toReceipt),
    enabled: !!jobCardId && enabled,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

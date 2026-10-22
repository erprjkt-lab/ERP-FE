import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteProductionReceipt,
  listProductionReceipts,
  receiveProduction,
} from '@/api/productionReceipts'
import type { ApiProductionReceipt, CreateProductionReceiptPayload } from '@/types/api/production'
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

export function useProductionReceipts(jobCardId: string | undefined) {
  const query = useQuery({
    queryKey: ['production', 'productionReceipts', jobCardId],
    queryFn: async () => (await listProductionReceipts(Number(jobCardId))).data.map(toReceipt),
    enabled: !!jobCardId,
  })
  return { ...query, data: query.data ?? [], isLoading: query.isLoading }
}

// Receiving moves finished goods into store and changes how much of the last
// step is still ready to move, which the job card header and process table both
// read from.
function useReceiptInvalidation(jobCardId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['production', 'productionReceipts', jobCardId] })
    queryClient.invalidateQueries({ queryKey: ['production', 'jobCards'] })
    queryClient.invalidateQueries({ queryKey: ['stock-balance'] })
    queryClient.invalidateQueries({ queryKey: ['stock-ledger'] })
  }
}

export function useReceiveProduction(jobCardId: string | undefined) {
  const invalidate = useReceiptInvalidation(jobCardId)
  return useMutation({
    mutationFn: async (payload: CreateProductionReceiptPayload) =>
      toReceipt((await receiveProduction(Number(jobCardId), payload)).data),
    onSuccess: invalidate,
  })
}

export function useDeleteProductionReceipt(jobCardId: string | undefined) {
  const invalidate = useReceiptInvalidation(jobCardId)
  return useMutation({
    mutationFn: (receiptId: string) => deleteProductionReceipt(Number(receiptId)),
    onSuccess: invalidate,
  })
}

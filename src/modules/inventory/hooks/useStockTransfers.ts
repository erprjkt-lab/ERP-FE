import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createStockTransfer,
  deleteStockTransfer,
  getStockTransfer,
  listStockTransfers,
} from '@/api/stockTransfers'
import type {
  ApiStockTransfer,
  ApiStockTransferItem,
  CreateStockTransferPayload,
} from '@/types/api/inventory'
import type { StockTransfer, StockTransferItem } from '@/types/inventory'

export interface StockTransferItemInput {
  itemId: string
  batchNo?: string
  heatNo?: string
  serialNo?: string
  qty: number
  remarks?: string
}

export interface StockTransferInput {
  transferDate: string
  fromLocationId: string
  toLocationId: string
  remarks?: string
  items: StockTransferItemInput[]
}

function toItem(api: ApiStockTransferItem): StockTransferItem {
  return {
    id: String(api.id),
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    batchNo: api.batch_no ?? undefined,
    heatNo: api.heat_no ?? undefined,
    serialNo: api.serial_no ?? undefined,
    qty: Number(api.qty),
    remarks: api.remarks ?? undefined,
  }
}

function toStockTransfer(api: ApiStockTransfer): StockTransfer {
  return {
    id: String(api.id),
    transferNumber: api.transfer_number,
    transferDate: api.transfer_date,
    fromLocationId: String(api.from_location_id),
    fromLocationName: api.from_location?.name,
    toLocationId: String(api.to_location_id),
    toLocationName: api.to_location?.name,
    remarks: api.remarks ?? undefined,
    items: (api.items ?? []).map(toItem),
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toPayload(input: StockTransferInput): CreateStockTransferPayload {
  return {
    transfer_date: input.transferDate,
    from_location_id: Number(input.fromLocationId),
    to_location_id: Number(input.toLocationId),
    remarks: input.remarks ?? null,
    items: input.items.map(item => ({
      item_id: Number(item.itemId),
      batch_no: item.batchNo || null,
      heat_no: item.heatNo || null,
      serial_no: item.serialNo || null,
      qty: item.qty,
      remarks: item.remarks || null,
    })),
  }
}

export function useStockTransfers() {
  const query = useQuery({
    queryKey: ['stock-transfers'],
    queryFn: async () => (await listStockTransfers()).data,
  })
  return { data: (query.data ?? []).map(toStockTransfer), isLoading: query.isLoading }
}

export function useStockTransfer(id: string | undefined) {
  const query = useQuery({
    queryKey: ['stock-transfers', id],
    queryFn: async () => toStockTransfer((await getStockTransfer(Number(id))).data),
    enabled: !!id,
  })
  return { data: query.data, isLoading: query.isLoading }
}

// A transfer posts both legs straight to the ledger, so balances move immediately.
function invalidateStockViews(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
  queryClient.invalidateQueries({ queryKey: ['stock-balance'] })
  queryClient.invalidateQueries({ queryKey: ['stock-ledger'] })
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: StockTransferInput) =>
      toStockTransfer((await createStockTransfer(toPayload(input))).data),
    onSuccess: () => invalidateStockViews(queryClient),
  })
}

export function useDeleteStockTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStockTransfer(Number(id)),
    onSuccess: () => invalidateStockViews(queryClient),
  })
}

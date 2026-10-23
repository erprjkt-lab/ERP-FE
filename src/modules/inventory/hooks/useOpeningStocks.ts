import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOpeningStock,
  deleteOpeningStock,
  getOpeningStock,
  listOpeningStocks,
} from '@/api/openingStocks'
import type {
  ApiOpeningStock,
  ApiOpeningStockItem,
  CreateOpeningStockPayload,
} from '@/types/api/inventory'
import type { OpeningStock, OpeningStockItem } from '@/types/inventory'

export interface OpeningStockItemInput {
  itemId: string
  locationId: string
  batchNo?: string
  heatNo?: string
  serialNo?: string
  qty: number
  rate?: number
  remarks?: string
}

export interface OpeningStockInput {
  entryDate: string
  remarks?: string
  items: OpeningStockItemInput[]
}

function toItem(api: ApiOpeningStockItem): OpeningStockItem {
  return {
    id: String(api.id),
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    locationId: String(api.location_id),
    locationName: api.location?.name,
    batchNo: api.batch_no ?? undefined,
    heatNo: api.heat_no ?? undefined,
    serialNo: api.serial_no ?? undefined,
    qty: Number(api.qty),
    rate: api.rate != null ? Number(api.rate) : undefined,
    remarks: api.remarks ?? undefined,
  }
}

function toOpeningStock(api: ApiOpeningStock): OpeningStock {
  return {
    id: String(api.id),
    entryNumber: api.entry_number,
    entryDate: api.entry_date,
    remarks: api.remarks ?? undefined,
    items: (api.items ?? []).map(toItem),
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toPayload(input: OpeningStockInput): CreateOpeningStockPayload {
  return {
    entry_date: input.entryDate,
    remarks: input.remarks ?? null,
    items: input.items.map(item => ({
      item_id: Number(item.itemId),
      location_id: Number(item.locationId),
      batch_no: item.batchNo || null,
      heat_no: item.heatNo || null,
      serial_no: item.serialNo || null,
      qty: item.qty,
      rate: item.rate ?? null,
      remarks: item.remarks || null,
    })),
  }
}

export function useOpeningStocks() {
  const query = useQuery({
    queryKey: ['opening-stocks'],
    queryFn: async () => (await listOpeningStocks()).data,
  })
  return { data: (query.data ?? []).map(toOpeningStock), isLoading: query.isLoading }
}

export function useOpeningStock(id: string | undefined) {
  const query = useQuery({
    queryKey: ['opening-stocks', id],
    queryFn: async () => toOpeningStock((await getOpeningStock(Number(id))).data),
    enabled: !!id,
  })
  return { data: query.data, isLoading: query.isLoading }
}

// Posting opening stock writes straight to the ledger, so the balance and ledger
// views are stale the moment this succeeds.
function invalidateStockViews(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['opening-stocks'] })
  queryClient.invalidateQueries({ queryKey: ['stock-balance'] })
  queryClient.invalidateQueries({ queryKey: ['stock-ledger'] })
}

export function useCreateOpeningStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: OpeningStockInput) =>
      toOpeningStock((await createOpeningStock(toPayload(input))).data),
    onSuccess: () => invalidateStockViews(queryClient),
  })
}

export function useDeleteOpeningStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteOpeningStock(Number(id)),
    onSuccess: () => invalidateStockViews(queryClient),
  })
}

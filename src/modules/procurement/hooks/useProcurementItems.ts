import { useLookupPaging } from '@/hooks/useLookupPaging'
import { useConsumables } from '@/modules/masters/hooks/useConsumables'
import { useFinishedGoods } from '@/modules/masters/hooks/useFinishedGoods'
import { useRawMaterials } from '@/modules/masters/hooks/useRawMaterials'

export interface ProcurementItemOption {
  id: string
  code: string
  name: string
  uomId: string | null
  uomName: string
  batchTracking: boolean
  heatTracking: boolean
  serialTracking: boolean
}

// Purchase modules must source items from the existing Item Master rather
// than a locally-duplicated list — combines the three item-master types
// (Finished Goods / Raw Materials / Consumables) into one flat pick list.
// `withNames` false drops `uomName` (and the uom/category/material-grade master
// fetches behind it) for callers that only label options with code and name.
export function useProcurementItems(withNames = true) {
  // One page size across the three types: ERP-BE has no `search` on item master,
  // so the picker filters the options it holds and `loadMore` widens all three.
  const { perPage, loadMore, hasMore } = useLookupPaging()
  const {
    data: finishedGoods = [],
    meta: finishedGoodsMeta,
    isLoading: loadingFinishedGoods,
  } = useFinishedGoods(1, perPage, withNames)
  const {
    data: rawMaterials = [],
    meta: rawMaterialsMeta,
    isLoading: loadingRawMaterials,
  } = useRawMaterials(1, perPage, withNames)
  const {
    data: consumables = [],
    meta: consumablesMeta,
    isLoading: loadingConsumables,
  } = useConsumables(1, perPage, withNames)

  const data: ProcurementItemOption[] = [...finishedGoods, ...rawMaterials, ...consumables].map(
    item => ({
      id: item.id,
      code: item.code,
      name: item.name,
      uomId: item.uomId ?? null,
      uomName: item.uom,
      batchTracking: item.batchTracking ?? false,
      heatTracking: item.heatTracking ?? false,
      serialTracking: item.serialTracking ?? false,
    }),
  )

  return {
    data,
    isLoading: loadingFinishedGoods || loadingRawMaterials || loadingConsumables,
    loadMore,
    hasMore:
      hasMore(finishedGoodsMeta?.total) ||
      hasMore(rawMaterialsMeta?.total) ||
      hasMore(consumablesMeta?.total),
  }
}

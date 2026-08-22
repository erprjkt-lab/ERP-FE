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
export function useProcurementItems() {
  const { data: finishedGoods = [], isLoading: loadingFinishedGoods } = useFinishedGoods()
  const { data: rawMaterials = [], isLoading: loadingRawMaterials } = useRawMaterials()
  const { data: consumables = [], isLoading: loadingConsumables } = useConsumables()

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
  }
}

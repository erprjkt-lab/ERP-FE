import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Real API data lives in TanStack Query (see hooks/) — this store only keeps
// client-only list-filter UI state, same split as
// modules/procurement/store/procurementStore.ts.
export interface ListFilters {
  search: string
  status: string | null
}
const DEFAULT_FILTERS: ListFilters = { search: '', status: null }

type FilterKey = 'requisition' | 'adjustment'

interface InventoryFilterState {
  requisitionFilters: ListFilters
  adjustmentFilters: ListFilters
  setFilter: (list: FilterKey, key: 'search' | 'status', value: string | null) => void
  resetFilter: (list: FilterKey) => void
}

export const useInventoryStore = create<InventoryFilterState>()(
  persist(
    set => ({
      requisitionFilters: DEFAULT_FILTERS,
      adjustmentFilters: DEFAULT_FILTERS,

      setFilter: (list, key, value) =>
        set(s => {
          switch (list) {
            case 'requisition':
              return { requisitionFilters: { ...s.requisitionFilters, [key]: value } }
            case 'adjustment':
              return { adjustmentFilters: { ...s.adjustmentFilters, [key]: value } }
          }
        }),
      resetFilter: list => {
        switch (list) {
          case 'requisition':
            return set({ requisitionFilters: DEFAULT_FILTERS })
          case 'adjustment':
            return set({ adjustmentFilters: DEFAULT_FILTERS })
        }
      },
    }),
    { name: 'erp-inventory-filters' },
  ),
)

export const useInventoryFilters = (list: FilterKey): ListFilters =>
  useInventoryStore(s => {
    switch (list) {
      case 'requisition':
        return s.requisitionFilters
      case 'adjustment':
        return s.adjustmentFilters
    }
  })

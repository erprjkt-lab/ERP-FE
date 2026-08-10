import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Real API data now lives in TanStack Query (see the hooks/ folder) — this
// store only keeps client-only list-filter UI state, same split as
// modules/masters/store/mastersStore.ts's filter slices.
export interface ListFilters {
  search: string
  status: string | null
}
const DEFAULT_FILTERS: ListFilters = { search: '', status: null }

type FilterKey = 'requisition' | 'enquiry' | 'quotation' | 'order'

interface ProcurementFilterState {
  requisitionFilters: ListFilters
  enquiryFilters: ListFilters
  quotationFilters: ListFilters
  orderFilters: ListFilters
  setFilter: (list: FilterKey, key: 'search' | 'status', value: string | null) => void
  resetFilter: (list: FilterKey) => void
}

export const useProcurementStore = create<ProcurementFilterState>()(
  persist(
    set => ({
      requisitionFilters: DEFAULT_FILTERS,
      enquiryFilters: DEFAULT_FILTERS,
      quotationFilters: DEFAULT_FILTERS,
      orderFilters: DEFAULT_FILTERS,

      setFilter: (list, key, value) =>
        set(s => {
          switch (list) {
            case 'requisition':
              return { requisitionFilters: { ...s.requisitionFilters, [key]: value } }
            case 'enquiry':
              return { enquiryFilters: { ...s.enquiryFilters, [key]: value } }
            case 'quotation':
              return { quotationFilters: { ...s.quotationFilters, [key]: value } }
            case 'order':
              return { orderFilters: { ...s.orderFilters, [key]: value } }
          }
        }),
      resetFilter: list => {
        switch (list) {
          case 'requisition':
            return set({ requisitionFilters: DEFAULT_FILTERS })
          case 'enquiry':
            return set({ enquiryFilters: DEFAULT_FILTERS })
          case 'quotation':
            return set({ quotationFilters: DEFAULT_FILTERS })
          case 'order':
            return set({ orderFilters: DEFAULT_FILTERS })
        }
      },
    }),
    { name: 'erp-procurement-filters' },
  ),
)

export const useProcurementFilters = (list: FilterKey): ListFilters =>
  useProcurementStore(s => {
    switch (list) {
      case 'requisition':
        return s.requisitionFilters
      case 'enquiry':
        return s.enquiryFilters
      case 'quotation':
        return s.quotationFilters
      case 'order':
        return s.orderFilters
    }
  })

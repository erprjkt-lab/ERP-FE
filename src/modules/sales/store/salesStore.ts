import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Server data lives in TanStack Query (see hooks/) — this store only holds the
// client-only list-filter UI state. Status is the one filter the sales index
// endpoints support; there is no free-text search parameter on the API, so no
// search field is kept here.
type FilterKey = 'enquiry' | 'quotation' | 'order' | 'challan' | 'invoice'

interface SalesFilterState {
  enquiryStatus: string | null
  quotationStatus: string | null
  orderStatus: string | null
  challanStatus: string | null
  invoiceStatus: string | null
  setStatus: (list: FilterKey, value: string | null) => void
}

export const useSalesStore = create<SalesFilterState>()(
  persist(
    set => ({
      enquiryStatus: null,
      quotationStatus: null,
      orderStatus: null,
      challanStatus: null,
      invoiceStatus: null,

      setStatus: (list, value) =>
        set(() => {
          switch (list) {
            case 'enquiry':
              return { enquiryStatus: value }
            case 'quotation':
              return { quotationStatus: value }
            case 'order':
              return { orderStatus: value }
            case 'challan':
              return { challanStatus: value }
            case 'invoice':
              return { invoiceStatus: value }
          }
        }),
    }),
    { name: 'erp-sales-filters' },
  ),
)

export const useSalesStatusFilter = (list: FilterKey): string | null =>
  useSalesStore(s => {
    switch (list) {
      case 'enquiry':
        return s.enquiryStatus
      case 'quotation':
        return s.quotationStatus
      case 'order':
        return s.orderStatus
      case 'challan':
        return s.challanStatus
      case 'invoice':
        return s.invoiceStatus
    }
  })

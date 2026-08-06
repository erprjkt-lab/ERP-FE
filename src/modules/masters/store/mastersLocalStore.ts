import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomerType, VendorType } from '@/types/masters'

interface MastersLocalState {
  customerTypes: Record<string, CustomerType | null>
  vendorTypes: Record<string, VendorType | null>
  setCustomerType: (customerId: string, value: CustomerType | null) => void
  removeCustomerType: (customerId: string) => void
  setVendorType: (vendorId: string, value: VendorType | null) => void
  removeVendorType: (vendorId: string) => void
  // item_master.image is a plain string(255) column with no real file-upload
  // endpoint on the backend — real image persistence isn't possible yet, so
  // previews for the 6 item-master entities live only in this local overlay.
  itemImages: Record<string, string>
  setItemImage: (itemId: string, value: string | undefined) => void
  removeItemImage: (itemId: string) => void
}

export const useMastersLocalStore = create<MastersLocalState>()(
  persist(
    set => ({
      customerTypes: {},
      vendorTypes: {},
      setCustomerType: (customerId, value) =>
        set(state => ({ customerTypes: { ...state.customerTypes, [customerId]: value } })),
      removeCustomerType: customerId =>
        set(state => {
          const next = { ...state.customerTypes }
          delete next[customerId]
          return { customerTypes: next }
        }),
      setVendorType: (vendorId, value) =>
        set(state => ({ vendorTypes: { ...state.vendorTypes, [vendorId]: value } })),
      removeVendorType: vendorId =>
        set(state => {
          const next = { ...state.vendorTypes }
          delete next[vendorId]
          return { vendorTypes: next }
        }),
      itemImages: {},
      setItemImage: (itemId, value) =>
        set(state => {
          if (value === undefined) {
            const next = { ...state.itemImages }
            delete next[itemId]
            return { itemImages: next }
          }
          return { itemImages: { ...state.itemImages, [itemId]: value } }
        }),
      removeItemImage: itemId =>
        set(state => {
          const next = { ...state.itemImages }
          delete next[itemId]
          return { itemImages: next }
        }),
    }),
    { name: 'erp-masters-local' },
  ),
)

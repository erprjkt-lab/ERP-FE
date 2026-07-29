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
    }),
    { name: 'erp-masters-local' },
  ),
)

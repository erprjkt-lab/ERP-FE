import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Status } from '@/types'
import type { Customer, CustomerType, Supplier, Vendor, VendorType } from '@/types/masters'
import { MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_VENDORS } from '../_mock/seed'
import { generateId, generateSequentialCode } from '../utils/generateCode'

const nowIso = () => new Date().toISOString()

export interface MasterListFilters {
  search: string
  status: Status | null
}

const DEFAULT_FILTERS: MasterListFilters = { search: '', status: null }

export type CustomerInput = Omit<Customer, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type SupplierInput = Omit<Supplier, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type VendorInput = Omit<Vendor, 'id' | 'code' | 'createdAt' | 'updatedAt'>

interface MastersState {
  customers: Customer[]
  suppliers: Supplier[]
  vendors: Vendor[]

  createCustomer: (input: CustomerInput) => Customer
  updateCustomer: (id: string, input: Partial<CustomerInput>) => void
  deleteCustomer: (id: string) => void

  createSupplier: (input: SupplierInput) => Supplier
  updateSupplier: (id: string, input: Partial<SupplierInput>) => void
  deleteSupplier: (id: string) => void

  createVendor: (input: VendorInput) => Vendor
  updateVendor: (id: string, input: Partial<VendorInput>) => void
  deleteVendor: (id: string) => void

  customerFilters: MasterListFilters & { customerType: CustomerType | null }
  setCustomerFilter: (key: 'search' | 'status' | 'customerType', value: string | null) => void
  resetCustomerFilters: () => void

  supplierFilters: MasterListFilters
  setSupplierFilter: (key: 'search' | 'status', value: string | null) => void
  resetSupplierFilters: () => void

  vendorFilters: MasterListFilters & { vendorType: VendorType | null }
  setVendorFilter: (key: 'search' | 'status' | 'vendorType', value: string | null) => void
  resetVendorFilters: () => void
}

export const useMastersStore = create<MastersState>()(
  persist(
    set => ({
      customers: MOCK_CUSTOMERS,
      suppliers: MOCK_SUPPLIERS,
      vendors: MOCK_VENDORS,

      createCustomer: input => {
        let record!: Customer
        set(s => {
          const code = generateSequentialCode(s.customers, 'CUST')
          record = {
            id: generateId('customer'),
            code,
            ...input,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          return { customers: [...s.customers, record] }
        })
        return record
      },
      updateCustomer: (id, input) =>
        set(s => ({
          customers: s.customers.map(c =>
            c.id === id ? { ...c, ...input, updatedAt: nowIso() } : c,
          ),
        })),
      deleteCustomer: id => set(s => ({ customers: s.customers.filter(c => c.id !== id) })),

      createSupplier: input => {
        let record!: Supplier
        set(s => {
          const code = generateSequentialCode(s.suppliers, 'SUPP')
          record = {
            id: generateId('supplier'),
            code,
            ...input,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          return { suppliers: [...s.suppliers, record] }
        })
        return record
      },
      updateSupplier: (id, input) =>
        set(s => ({
          suppliers: s.suppliers.map(sup =>
            sup.id === id ? { ...sup, ...input, updatedAt: nowIso() } : sup,
          ),
        })),
      deleteSupplier: id => set(s => ({ suppliers: s.suppliers.filter(sup => sup.id !== id) })),

      createVendor: input => {
        let record!: Vendor
        set(s => {
          const code = generateSequentialCode(s.vendors, 'VEND')
          record = {
            id: generateId('vendor'),
            code,
            ...input,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          return { vendors: [...s.vendors, record] }
        })
        return record
      },
      updateVendor: (id, input) =>
        set(s => ({
          vendors: s.vendors.map(v => (v.id === id ? { ...v, ...input, updatedAt: nowIso() } : v)),
        })),
      deleteVendor: id => set(s => ({ vendors: s.vendors.filter(v => v.id !== id) })),

      customerFilters: { ...DEFAULT_FILTERS, customerType: null },
      setCustomerFilter: (key, value) =>
        set(s => ({ customerFilters: { ...s.customerFilters, [key]: value } })),
      resetCustomerFilters: () =>
        set({ customerFilters: { ...DEFAULT_FILTERS, customerType: null } }),

      supplierFilters: { ...DEFAULT_FILTERS },
      setSupplierFilter: (key, value) =>
        set(s => ({ supplierFilters: { ...s.supplierFilters, [key]: value } })),
      resetSupplierFilters: () => set({ supplierFilters: { ...DEFAULT_FILTERS } }),

      vendorFilters: { ...DEFAULT_FILTERS, vendorType: null },
      setVendorFilter: (key, value) =>
        set(s => ({ vendorFilters: { ...s.vendorFilters, [key]: value } })),
      resetVendorFilters: () => set({ vendorFilters: { ...DEFAULT_FILTERS, vendorType: null } }),
    }),
    { name: 'erp-masters', version: 2 },
  ),
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Status } from '@/types'
import type {
  Consumable,
  Customer,
  CustomerType,
  DieBlock,
  Fixture,
  FinishedGood,
  GaugeInstrument,
  Machine,
  PackingMaterial,
  RawMaterial,
  Supplier,
  Vendor,
  VendorType,
} from '@/types/masters'
import { MOCK_DIE_BLOCKS, MOCK_FIXTURES } from '../_mock/seed'
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

export type FinishedGoodInput = Omit<FinishedGood, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type RawMaterialInput = Omit<RawMaterial, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type ConsumableInput = Omit<Consumable, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type MachineInput = Omit<Machine, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type GaugeInstrumentInput = Omit<GaugeInstrument, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type PackingMaterialInput = Omit<PackingMaterial, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type FixtureInput = Omit<Fixture, 'id' | 'code' | 'createdAt' | 'updatedAt'>
export type DieBlockInput = Omit<DieBlock, 'id' | 'code' | 'createdAt' | 'updatedAt'>

interface MastersState {
  customerFilters: MasterListFilters & { customerType: CustomerType | null }
  setCustomerFilter: (key: 'search' | 'status' | 'customerType', value: string | null) => void
  resetCustomerFilters: () => void

  supplierFilters: MasterListFilters
  setSupplierFilter: (key: 'search' | 'status', value: string | null) => void
  resetSupplierFilters: () => void

  vendorFilters: MasterListFilters & { vendorType: VendorType | null }
  setVendorFilter: (key: 'search' | 'status' | 'vendorType', value: string | null) => void
  resetVendorFilters: () => void

  finishedGoodFilters: MasterListFilters
  setFinishedGoodFilter: (key: 'search' | 'status', value: string | null) => void
  resetFinishedGoodFilters: () => void

  rawMaterialFilters: MasterListFilters
  setRawMaterialFilter: (key: 'search' | 'status', value: string | null) => void
  resetRawMaterialFilters: () => void

  fixtures: Fixture[]
  createFixture: (input: FixtureInput) => Fixture
  updateFixture: (id: string, input: Partial<FixtureInput>) => void
  deleteFixture: (id: string) => void

  dieBlocks: DieBlock[]
  createDieBlock: (input: DieBlockInput) => DieBlock
  updateDieBlock: (id: string, input: Partial<DieBlockInput>) => void
  deleteDieBlock: (id: string) => void
}

type ArrayEntityKey = 'fixtures' | 'dieBlocks'

type SetMasters = (fn: (state: MastersState) => Partial<MastersState>) => void

// Shared CRUD builder for the remaining mock item-master entities (Fixture,
// Die/Block) — the backend has no API for these at all, so they stay
// Zustand-backed. Customer/Supplier/Vendor and the other 6 item-master types
// (Finished Goods, Raw Material, Consumables, Machine, Gauge & Instrument,
// Packing Material) no longer live in this store — they're wired to the real
// backend (see modules/masters/hooks/useCustomers.ts, useFinishedGoods.ts,
// etc.); only Finished Goods'/Raw Material's filter UI state remains here.
function makeCrudActions<K extends ArrayEntityKey>(
  set: SetMasters,
  arrayKey: K,
  idPrefix: string,
  codePrefix: string,
) {
  type T = MastersState[K][number]
  type Input = Omit<T, 'id' | 'code' | 'createdAt' | 'updatedAt'>

  return {
    create: (input: Input): T => {
      let record!: T
      set(s => {
        const code = generateSequentialCode(s[arrayKey], codePrefix)
        record = {
          id: generateId(idPrefix),
          code,
          ...input,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        } as T
        return { [arrayKey]: [...s[arrayKey], record] } as Partial<MastersState>
      })
      return record
    },
    update: (id: string, input: Partial<Input>) =>
      set(
        s =>
          ({
            [arrayKey]: s[arrayKey].map((item: T) =>
              (item as { id: string }).id === id
                ? { ...item, ...input, updatedAt: nowIso() }
                : item,
            ),
          }) as Partial<MastersState>,
      ),
    delete: (id: string) =>
      set(
        s =>
          ({
            [arrayKey]: s[arrayKey].filter((item: T) => (item as { id: string }).id !== id),
          }) as Partial<MastersState>,
      ),
  }
}

export const useMastersStore = create<MastersState>()(
  persist(
    set => {
      const fixtureCrud = makeCrudActions(set, 'fixtures', 'fixture', 'FIX')
      const dieBlockCrud = makeCrudActions(set, 'dieBlocks', 'die', 'DIE')

      return {
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

        finishedGoodFilters: { ...DEFAULT_FILTERS },
        setFinishedGoodFilter: (key, value) =>
          set(s => ({ finishedGoodFilters: { ...s.finishedGoodFilters, [key]: value } })),
        resetFinishedGoodFilters: () => set({ finishedGoodFilters: { ...DEFAULT_FILTERS } }),

        rawMaterialFilters: { ...DEFAULT_FILTERS },
        setRawMaterialFilter: (key, value) =>
          set(s => ({ rawMaterialFilters: { ...s.rawMaterialFilters, [key]: value } })),
        resetRawMaterialFilters: () => set({ rawMaterialFilters: { ...DEFAULT_FILTERS } }),

        fixtures: MOCK_FIXTURES,
        createFixture: input => fixtureCrud.create(input),
        updateFixture: (id, input) => fixtureCrud.update(id, input),
        deleteFixture: id => fixtureCrud.delete(id),

        dieBlocks: MOCK_DIE_BLOCKS,
        createDieBlock: input => dieBlockCrud.create(input),
        updateDieBlock: (id, input) => dieBlockCrud.update(id, input),
        deleteDieBlock: id => dieBlockCrud.delete(id),
      } satisfies MastersState
    },
    { name: 'erp-masters', version: 4 },
  ),
)

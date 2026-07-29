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
import {
  MOCK_CONSUMABLES,
  MOCK_DIE_BLOCKS,
  MOCK_FIXTURES,
  MOCK_FINISHED_GOODS,
  MOCK_GAUGE_INSTRUMENTS,
  MOCK_MACHINES,
  MOCK_PACKING_MATERIALS,
  MOCK_RAW_MATERIALS,
} from '../_mock/seed'
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

  finishedGoods: FinishedGood[]
  createFinishedGood: (input: FinishedGoodInput) => FinishedGood
  updateFinishedGood: (id: string, input: Partial<FinishedGoodInput>) => void
  deleteFinishedGood: (id: string) => void
  finishedGoodFilters: MasterListFilters
  setFinishedGoodFilter: (key: 'search' | 'status', value: string | null) => void
  resetFinishedGoodFilters: () => void

  rawMaterials: RawMaterial[]
  createRawMaterial: (input: RawMaterialInput) => RawMaterial
  updateRawMaterial: (id: string, input: Partial<RawMaterialInput>) => void
  deleteRawMaterial: (id: string) => void
  rawMaterialFilters: MasterListFilters
  setRawMaterialFilter: (key: 'search' | 'status', value: string | null) => void
  resetRawMaterialFilters: () => void

  consumables: Consumable[]
  createConsumable: (input: ConsumableInput) => Consumable
  updateConsumable: (id: string, input: Partial<ConsumableInput>) => void
  deleteConsumable: (id: string) => void

  machines: Machine[]
  createMachine: (input: MachineInput) => Machine
  updateMachine: (id: string, input: Partial<MachineInput>) => void
  deleteMachine: (id: string) => void

  gaugeInstruments: GaugeInstrument[]
  createGaugeInstrument: (input: GaugeInstrumentInput) => GaugeInstrument
  updateGaugeInstrument: (id: string, input: Partial<GaugeInstrumentInput>) => void
  deleteGaugeInstrument: (id: string) => void

  packingMaterials: PackingMaterial[]
  createPackingMaterial: (input: PackingMaterialInput) => PackingMaterial
  updatePackingMaterial: (id: string, input: Partial<PackingMaterialInput>) => void
  deletePackingMaterial: (id: string) => void

  fixtures: Fixture[]
  createFixture: (input: FixtureInput) => Fixture
  updateFixture: (id: string, input: Partial<FixtureInput>) => void
  deleteFixture: (id: string) => void

  dieBlocks: DieBlock[]
  createDieBlock: (input: DieBlockInput) => DieBlock
  updateDieBlock: (id: string, input: Partial<DieBlockInput>) => void
  deleteDieBlock: (id: string) => void
}

type ArrayEntityKey =
  | 'finishedGoods'
  | 'rawMaterials'
  | 'consumables'
  | 'machines'
  | 'gaugeInstruments'
  | 'packingMaterials'
  | 'fixtures'
  | 'dieBlocks'

type SetMasters = (fn: (state: MastersState) => Partial<MastersState>) => void

// Shared CRUD builder for the 8 item-master entities below — they're all a
// plain { id, code, createdAt, updatedAt, ...fields } array with identical
// create/update/delete semantics, so this avoids ~160 lines of copy-pasted
// boilerplate. Customer/Supplier/Vendor no longer live in this store — they're
// wired to the real party_master API (see modules/masters/hooks/useCustomers.ts
// etc.); only their filter UI state remains here. The external MastersState
// interface still exposes fully explicit, named fields/actions (finishedGoods,
// createFinishedGood, ...) — genericity is internal only.
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
      const finishedGoodCrud = makeCrudActions(set, 'finishedGoods', 'fg', 'FG')
      const rawMaterialCrud = makeCrudActions(set, 'rawMaterials', 'rm', 'RM')
      const consumableCrud = makeCrudActions(set, 'consumables', 'cons', 'CONS')
      const machineCrud = makeCrudActions(set, 'machines', 'machine', 'MACH')
      const gaugeInstrumentCrud = makeCrudActions(set, 'gaugeInstruments', 'gauge', 'GI')
      const packingMaterialCrud = makeCrudActions(set, 'packingMaterials', 'packing', 'PACK')
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

        finishedGoods: MOCK_FINISHED_GOODS,
        createFinishedGood: input => finishedGoodCrud.create(input),
        updateFinishedGood: (id, input) => finishedGoodCrud.update(id, input),
        deleteFinishedGood: id => finishedGoodCrud.delete(id),
        finishedGoodFilters: { ...DEFAULT_FILTERS },
        setFinishedGoodFilter: (key, value) =>
          set(s => ({ finishedGoodFilters: { ...s.finishedGoodFilters, [key]: value } })),
        resetFinishedGoodFilters: () => set({ finishedGoodFilters: { ...DEFAULT_FILTERS } }),

        rawMaterials: MOCK_RAW_MATERIALS,
        createRawMaterial: input => rawMaterialCrud.create(input),
        updateRawMaterial: (id, input) => rawMaterialCrud.update(id, input),
        deleteRawMaterial: id => rawMaterialCrud.delete(id),
        rawMaterialFilters: { ...DEFAULT_FILTERS },
        setRawMaterialFilter: (key, value) =>
          set(s => ({ rawMaterialFilters: { ...s.rawMaterialFilters, [key]: value } })),
        resetRawMaterialFilters: () => set({ rawMaterialFilters: { ...DEFAULT_FILTERS } }),

        consumables: MOCK_CONSUMABLES,
        createConsumable: input => consumableCrud.create(input),
        updateConsumable: (id, input) => consumableCrud.update(id, input),
        deleteConsumable: id => consumableCrud.delete(id),

        machines: MOCK_MACHINES,
        createMachine: input => machineCrud.create(input),
        updateMachine: (id, input) => machineCrud.update(id, input),
        deleteMachine: id => machineCrud.delete(id),

        gaugeInstruments: MOCK_GAUGE_INSTRUMENTS,
        createGaugeInstrument: input => gaugeInstrumentCrud.create(input),
        updateGaugeInstrument: (id, input) => gaugeInstrumentCrud.update(id, input),
        deleteGaugeInstrument: id => gaugeInstrumentCrud.delete(id),

        packingMaterials: MOCK_PACKING_MATERIALS,
        createPackingMaterial: input => packingMaterialCrud.create(input),
        updatePackingMaterial: (id, input) => packingMaterialCrud.update(id, input),
        deletePackingMaterial: id => packingMaterialCrud.delete(id),

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
    { name: 'erp-masters', version: 3 },
  ),
)

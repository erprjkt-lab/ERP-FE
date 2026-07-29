import type {
  Consumable,
  DieBlock,
  Fixture,
  FinishedGood,
  GaugeInstrument,
  Machine,
  PackingMaterial,
  RawMaterial,
} from '@/types/masters'

const STATUSES = ['active', 'active', 'active', 'inactive'] as const

// Demo-only display name for FinishedGood's denormalized customer reference —
// Customer records now come from the real party_master API, not this file.
const DEMO_CUSTOMER_NAMES = ['Shree Balaji Traders', 'Sunrise Retail Chain', 'Om Enterprises']

const FG_NAMES = [
  'Precision Gear Assembly',
  'Hydraulic Cylinder Unit',
  'Bearing Housing MK2',
  'Drive Shaft Coupling',
  'Valve Body Casting',
  'Motor Mount Bracket',
]

export const MOCK_FINISHED_GOODS: FinishedGood[] = Array.from({ length: 8 }, (_, i) => {
  return {
    id: `fg-${i + 1}`,
    code: `FG-${String(i + 1).padStart(4, '0')}`,
    name: FG_NAMES[i % FG_NAMES.length],
    category: 'Finished Good',
    brand: undefined,
    uom: ['NOS', 'PCS', 'SET'][i % 3],
    alternateUom: undefined,
    hsnCode: `84${String(830000 + i)}`,
    gstPercent: [5, 12, 18][i % 3],
    description: `${FG_NAMES[i % FG_NAMES.length]} manufactured to customer drawing spec`,
    status: STATUSES[i % STATUSES.length],
    imageUrl: undefined,
    customerId: undefined,
    customerName: DEMO_CUSTOMER_NAMES[i % DEMO_CUSTOMER_NAMES.length],
    customerPartNo: `CP-${String(1000 + i)}`,
    drawingNo: `DWG-${String(2000 + i)}`,
    drawingRevision: ['A', 'B', 'C'][i % 3],
    drawingFileName: undefined,
    materialGrade: ['EN8', 'EN19', 'SS304'][i % 3],
    weight: 0.5 + i * 0.25,
    price: 500 + i * 150,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  }
})

const RM_NAMES = [
  'MS Round Bar',
  'SS304 Sheet',
  'Aluminium Billet',
  'Brass Rod',
  'Copper Wire Coil',
  'Cast Iron Ingot',
]

export const MOCK_RAW_MATERIALS: RawMaterial[] = Array.from({ length: 8 }, (_, i) => ({
  id: `rm-${i + 1}`,
  code: `RM-${String(i + 1).padStart(4, '0')}`,
  name: RM_NAMES[i % RM_NAMES.length],
  category: 'Raw Material',
  brand: undefined,
  uom: ['KG', 'MTR', 'NOS'][i % 3],
  alternateUom: undefined,
  hsnCode: `72${String(140000 + i)}`,
  gstPercent: [5, 12, 18][i % 3],
  description: `${RM_NAMES[i % RM_NAMES.length]} stock material`,
  status: STATUSES[i % STATUSES.length],
  imageUrl: undefined,
  materialGrade: ['EN8', 'EN19', 'SS304'][i % 3],
  materialType: ['Ferrous', 'Non-Ferrous'][i % 2],
  shape: ['Round', 'Sheet', 'Rod', 'Ingot'][i % 4],
  diameter: 10 + i * 2,
  width: undefined,
  thickness: undefined,
  length: 1000 + i * 100,
  density: 7.85,
  color: undefined,
  price: 60 + i * 5,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}))

const CONSUMABLE_NAMES = [
  'Cutting Oil',
  'Safety Gloves',
  'Welding Rod',
  'Grinding Wheel',
  'Machine Grease',
  'Cotton Waste',
]

export const MOCK_CONSUMABLES: Consumable[] = Array.from({ length: 6 }, (_, i) => ({
  id: `cons-${i + 1}`,
  code: `CONS-${String(i + 1).padStart(4, '0')}`,
  name: CONSUMABLE_NAMES[i % CONSUMABLE_NAMES.length],
  category: 'Consumable',
  uom: ['LTR', 'PC', 'KG'][i % 3],
  alternateUom: undefined,
  hsnCode: `34${String(20000 + i)}`,
  gstPercent: [12, 18][i % 2],
  description: `${CONSUMABLE_NAMES[i % CONSUMABLE_NAMES.length]} for shop-floor use`,
  status: STATUSES[i % STATUSES.length],
  imageUrl: undefined,
  price: 100 + i * 20,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}))

const MACHINE_NAMES = [
  'CNC Lathe',
  'VMC Machine',
  'Hydraulic Press',
  'Surface Grinder',
  'Power Press',
  'Welding Machine',
]

export const MOCK_MACHINES: Machine[] = Array.from({ length: 6 }, (_, i) => ({
  id: `machine-${i + 1}`,
  code: `MACH-${String(i + 1).padStart(4, '0')}`,
  name: MACHINE_NAMES[i % MACHINE_NAMES.length],
  machineMake: ['HMT', 'Lokesh', 'Bharat Fritz Werner', 'Ace Micromatic'][i % 4],
  model: `M-${2018 + i}`,
  serialNumber: `SN-${String(100000 + i)}`,
  capacity: ['5 Ton', '10 Ton', '50 Ton', '500 Ton'][i % 4],
  powerRating: `${5 + i * 2} kW`,
  installationDate: '2022-03-15',
  purchaseDate: '2022-02-01',
  warrantyExpiry: '2025-02-01',
  amcExpiry: '2026-02-01',
  maintenanceInterval: 'Quarterly',
  machineLocation: `Shop Floor ${(i % 3) + 1}`,
  price: 500000 + i * 75000,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}))

const GAUGE_NAMES = [
  'Digital Vernier Caliper',
  'Micrometer',
  'Dial Gauge',
  'Height Gauge',
  'Bore Gauge',
  'Surface Plate',
]

export const MOCK_GAUGE_INSTRUMENTS: GaugeInstrument[] = Array.from({ length: 6 }, (_, i) => ({
  id: `gauge-${i + 1}`,
  code: `GI-${String(i + 1).padStart(4, '0')}`,
  name: GAUGE_NAMES[i % GAUGE_NAMES.length],
  gaugeType: ['Caliper', 'Micrometer', 'Dial', 'Height', 'Bore', 'Plate'][i % 6],
  instrumentRange: ['0-150mm', '0-25mm', '0-10mm', '0-300mm', '18-35mm', '300x300mm'][i % 6],
  accuracy: '±0.01mm',
  leastCount: '0.01mm',
  calibrationFrequency: 'Annual',
  calibrationDueDate: '2026-06-30',
  certificateNumber: `CAL-${String(5000 + i)}`,
  manufacturer: ['Mitutoyo', 'Insize', 'Baker'][i % 3],
  category: 'Gauge & Instrument',
  price: 2000 + i * 500,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}))

const PACKING_NAMES = [
  'Corrugated Box',
  'Bubble Wrap Roll',
  'Wooden Pallet',
  'Stretch Film',
  'PP Strap Roll',
]

export const MOCK_PACKING_MATERIALS: PackingMaterial[] = Array.from({ length: 5 }, (_, i) => ({
  id: `packing-${i + 1}`,
  code: `PACK-${String(i + 1).padStart(4, '0')}`,
  name: PACKING_NAMES[i % PACKING_NAMES.length],
  category: 'Packing Material',
  uom: ['PC', 'ROLL', 'PC', 'ROLL', 'ROLL'][i % 5],
  price: 30 + i * 10,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}))

const FIXTURE_NAMES = ['Drilling Fixture A1', 'Welding Jig B2', 'Assembly Fixture C3']

export const MOCK_FIXTURES: Fixture[] = Array.from({ length: 3 }, (_, i) => ({
  id: `fixture-${i + 1}`,
  code: `FIX-${String(i + 1).padStart(4, '0')}`,
  name: FIXTURE_NAMES[i % FIXTURE_NAMES.length],
  category: 'Fixture',
  uom: 'NOS',
  price: 15000 + i * 5000,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}))

const DIE_BLOCK_NAMES = ['Punch Die Set D1', 'Blanking Die D2', 'Forming Die D3']

export const MOCK_DIE_BLOCKS: DieBlock[] = Array.from({ length: 3 }, (_, i) => ({
  id: `die-${i + 1}`,
  code: `DIE-${String(i + 1).padStart(4, '0')}`,
  name: DIE_BLOCK_NAMES[i % DIE_BLOCK_NAMES.length],
  category: 'Die/Block',
  uom: 'NOS',
  price: 25000 + i * 8000,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}))

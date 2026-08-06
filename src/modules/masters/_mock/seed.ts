import type { DieBlock, Fixture } from '@/types/masters'

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

export interface ItemCategoryNavEntry {
  path: string
  label: string
  /** No field list confirmed yet in the source spec — ships with a generic placeholder schema. */
  draftSchema?: boolean
}

export const ITEM_CATEGORY_NAV: ItemCategoryNavEntry[] = [
  { path: 'consumables', label: 'Consumables' },
  { path: 'machine', label: 'Machine' },
  { path: 'gauges-instruments', label: 'Gauge & Instrument' },
  { path: 'packing-materials', label: 'Packing Material' },
  { path: 'fixtures', label: 'Fixture', draftSchema: true },
  { path: 'dies-blocks', label: 'Die/Block', draftSchema: true },
]

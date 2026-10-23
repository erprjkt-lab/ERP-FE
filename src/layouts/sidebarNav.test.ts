import { describe, expect, it } from 'vitest'
import type { ApiSidebarNode } from '@/types/api/rbac'
import { buildSidebarItems, findActiveKeys } from './sidebarNav'

const node = (
  overrides: Partial<ApiSidebarNode> & { id: number; name: string },
): ApiSidebarNode => ({
  icon: null,
  route: null,
  module_key: null,
  sequence: 0,
  can: { read: true, write: false, modify: false, delete: false, approve: false },
  children: [],
  ...overrides,
})

describe('buildSidebarItems', () => {
  it('points a module at its page and keeps the BE name', () => {
    const [group] = buildSidebarItems([
      node({
        id: 5,
        name: 'Sales',
        icon: 'trending-up',
        children: [node({ id: 43, name: 'Sales Orders', module_key: 'sales-orders' })],
      }),
    ])

    expect(group).toMatchObject({ key: 'folder-5', label: 'Sales' })
    expect('children' in group ? group.children : []).toEqual([
      { key: '/sales/orders', label: 'Sales Orders', icon: undefined },
    ])
  })

  it('nests a module that backs several pages here', () => {
    const [group] = buildSidebarItems([
      node({
        id: 8,
        name: 'Quality',
        children: [node({ id: 56, name: 'Inspection Reports', module_key: 'inspection-reports' })],
      }),
    ])
    const reports = 'children' in group ? group.children[0] : undefined

    expect(reports).toMatchObject({ key: 'module-56', label: 'Inspection Reports' })
    expect(reports && 'children' in reports ? reports.children.map(c => c.key) : []).toEqual([
      '/quality/ipr',
      '/quality/fir',
      '/quality/iir',
    ])
  })

  it('sends a module with no page here to a pending placeholder', () => {
    const [group] = buildSidebarItems([
      node({
        id: 7,
        name: 'Production',
        children: [node({ id: 55, name: 'Cutting', module_key: 'cutting' })],
      }),
    ])

    expect('children' in group ? group.children : []).toEqual([
      { key: '/pending/cutting', label: 'Cutting', icon: undefined },
    ])
  })

  it('drops a folder whose children are all hidden', () => {
    expect(buildSidebarItems([node({ id: 1, name: 'Administration' })])).toEqual([])
  })

  // ERP-BE has shipped two key shapes for reports — one module per area and one
  // per report — and a deployment can be on either. Neither may expand in the
  // sidebar: both collapse to a single link to the landing page.
  it.each([
    ['one module per area', ['reports-inventory', 'reports-purchase']],
    ['one module per report', ['report-stock-ledger', 'report-grn-register']],
  ])('collapses the reports folder into one link (%s)', (_label, moduleKeys) => {
    const [group] = buildSidebarItems([
      node({
        id: 9,
        name: 'Reports',
        icon: 'bar-chart-2',
        children: moduleKeys.map((module_key, index) =>
          node({ id: 90 + index, name: `Report ${index}`, module_key }),
        ),
      }),
    ])

    expect(group).toMatchObject({ key: '/reports', label: 'Reports' })
    expect('children' in group).toBe(false)
  })

  it('still expands a reports folder the employee can see nothing in', () => {
    expect(buildSidebarItems([node({ id: 9, name: 'Reports', icon: 'bar-chart-2' })])).toEqual([])
  })

  it('leaves a non-report folder expanded', () => {
    const [group] = buildSidebarItems([
      node({
        id: 5,
        name: 'Sales',
        children: [node({ id: 43, name: 'Sales Orders', module_key: 'sales-orders' })],
      }),
    ])

    expect('children' in group).toBe(true)
  })
})

describe('findActiveKeys', () => {
  const items = buildSidebarItems([
    node({
      id: 5,
      name: 'Sales',
      children: [node({ id: 43, name: 'Sales Orders', module_key: 'sales-orders' })],
    }),
  ])

  it('selects the leaf a detail route sits under and opens its branch', () => {
    expect(findActiveKeys(items, '/sales/orders/12')).toEqual({
      selectedKey: '/sales/orders',
      openKeys: ['folder-5'],
    })
  })

  it('selects nothing for an unrelated route', () => {
    expect(findActiveKeys(items, '/dashboard')).toEqual({ selectedKey: undefined, openKeys: [] })
  })
})

describe('quality module labels', () => {
  // ERP-BE's registry labels `inspection-reports` "IIR" and
  // `inspection-parameters` "IPR" (config/rbac_modules.php), which names each
  // module after one of its own screens.
  const qualityTree = [
    {
      id: 90,
      name: 'Quality',
      icon: 'check-circle',
      route: null,
      module_key: null,
      sequence: 1,
      children: [
        {
          id: 91,
          name: 'IIR',
          icon: 'clipboard',
          route: 'inspection-reports',
          module_key: 'inspection-reports',
          sequence: 10,
          children: [],
        },
        {
          id: 92,
          name: 'IPR',
          icon: 'sliders',
          route: null,
          module_key: 'inspection-parameters',
          sequence: 20,
          children: [],
        },
      ],
    },
  ] as unknown as ApiSidebarNode[]

  it('groups IPR, FIR and IIR under one correctly named submenu', () => {
    const [quality] = buildSidebarItems(qualityTree)
    const group = (quality as { children: { key: string; label: string }[] }).children[0]

    expect(group.label).toBe('Inspection Reports')
    expect((group as unknown as { children: { key: string }[] }).children.map(c => c.key)).toEqual([
      '/quality/ipr',
      '/quality/fir',
      '/quality/iir',
    ])
  })

  it('does not label the parameter master after a report', () => {
    const [quality] = buildSidebarItems(qualityTree)
    const leaf = (quality as { children: { key: string; label: string }[] }).children[1]

    expect(leaf.label).toBe('Inspection Parameters')
    expect(leaf.key).toBe('/quality/inspection-parameters')
  })
})

describe('quality modules as separate backend keys', () => {
  // The deployment this app points at sends ipr/fir/iir as three modules rather
  // than one consolidated `inspection-reports`. Unmapped, each fell through to
  // the /pending placeholder and the built screens looked unfinished.
  const splitTree = [
    {
      id: 90,
      name: 'Quality',
      icon: 'check-circle',
      route: null,
      module_key: null,
      sequence: 1,
      children: [
        { id: 93, name: 'IPR', module_key: 'ipr', sequence: 10, children: [] },
        { id: 94, name: 'FIR', module_key: 'fir', sequence: 20, children: [] },
        {
          id: 92,
          name: 'IPR',
          module_key: 'inspection-parameters',
          sequence: 30,
          children: [],
        },
        { id: 95, name: 'IIR', module_key: 'iir', sequence: 40, children: [] },
      ],
    },
  ] as unknown as ApiSidebarNode[]

  it('routes each to its built page instead of the pending placeholder', () => {
    const [quality] = buildSidebarItems(splitTree)
    const leaves = (quality as { children: { key: string; label: string }[] }).children

    expect(leaves.map(l => l.key)).toEqual([
      '/quality/ipr',
      '/quality/fir',
      '/quality/inspection-parameters',
      '/quality/iir',
    ])
    expect(leaves.every(l => !l.key.startsWith('/pending/'))).toBe(true)
  })

  it('does not leave two entries both labelled IPR', () => {
    const [quality] = buildSidebarItems(splitTree)
    const labels = (quality as { children: { label: string }[] }).children.map(l => l.label)

    expect(labels).toEqual(['IPR', 'FIR', 'Inspection Parameters', 'IIR'])
  })
})

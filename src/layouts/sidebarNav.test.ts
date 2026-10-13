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

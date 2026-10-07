import { describe, expect, it } from 'vitest'
import type { ApiEmployeeMenuNode } from '@/types/api/rbac'
import {
  changedMenus,
  permissionBearingRows,
  selectionSummary,
  toPermissionRows,
} from './menuPermissions'

const node = (
  overrides: Partial<ApiEmployeeMenuNode> & { id: number; name: string },
): ApiEmployeeMenuNode => ({
  icon: null,
  route: null,
  module_key: null,
  available_actions: [],
  granted_actions: [],
  sequence: 0,
  is_active: true,
  children: [],
  ...overrides,
})

const tree = [
  node({
    id: 1,
    name: 'Administration',
    children: [
      node({
        id: 9,
        name: 'Employees',
        module_key: 'employees',
        available_actions: ['read', 'write', 'modify', 'delete'],
        granted_actions: ['read', 'write'],
      }),
    ],
  }),
]

describe('changedMenus', () => {
  const rows = toPermissionRows(tree)

  it('sends only the menus whose action set actually changed', () => {
    expect(changedMenus(rows, { 9: ['read', 'write', 'delete'] })).toEqual([
      { menu_id: 9, actions: ['read', 'write', 'delete'] },
    ])
  })

  it('ignores an edit that lands back on what is already granted', () => {
    expect(changedMenus(rows, { 9: ['write', 'read'] })).toEqual([])
  })

  it('sends an empty action set when every box is cleared', () => {
    expect(changedMenus(rows, { 9: [] })).toEqual([{ menu_id: 9, actions: [] }])
  })

  it('has nothing to send before anything is touched', () => {
    expect(changedMenus(rows, {})).toEqual([])
  })
})

describe('selectionSummary', () => {
  const [folder] = toPermissionRows(tree)
  const targets = permissionBearingRows(folder)

  it('skips the folder itself and counts the menus inside it', () => {
    expect(targets.map(row => row.key)).toEqual([9])
    expect(selectionSummary(targets, {})).toEqual({ selected: 2, total: 4 })
  })

  it('counts an edit rather than what the BE granted', () => {
    expect(selectionSummary(targets, { 9: ['read', 'write', 'modify', 'delete'] })).toEqual({
      selected: 4,
      total: 4,
    })
  })

  it('ignores a granted action the menu no longer offers', () => {
    const stale = toPermissionRows([
      { ...tree[0].children[0], granted_actions: ['read', 'approve'] },
    ])
    expect(selectionSummary(stale, {})).toEqual({ selected: 1, total: 4 })
  })
})

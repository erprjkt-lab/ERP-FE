import { describe, expect, it } from 'vitest'
import { resolveRoutePermissions } from './usePagePermission'
import type { ModulePermissions } from '@/store/permissionStore'

const mod = (moduleKey: string): ModulePermissions => ({
  id: 1,
  name: moduleKey,
  moduleKey,
  route: null,
  icon: null,
  can: { read: true, write: false, modify: false, delete: false, approve: false },
})

const routes: Record<string, ModulePermissions> = {
  '/': mod('dashboard'),
  '/purchase/orders': mod('purchase-orders'),
  '/masters/items/consumables': mod('consumables'),
  '/masters/items/machine': mod('machines'),
  '/inventory/ledger': mod('stock'),
}

describe('resolveRoutePermissions', () => {
  it('matches a list route exactly', () => {
    expect(resolveRoutePermissions('/purchase/orders', routes)?.moduleKey).toBe('purchase-orders')
  })

  it('resolves detail, new and edit routes from their list prefix', () => {
    for (const path of [
      '/purchase/orders/12',
      '/purchase/orders/new',
      '/purchase/orders/12/edit',
    ]) {
      expect(resolveRoutePermissions(path, routes)?.moduleKey).toBe('purchase-orders')
    }
  })

  it('prefers the longest matching prefix over a shorter sibling', () => {
    expect(resolveRoutePermissions('/masters/items/machine', routes)?.moduleKey).toBe('machines')
  })

  it('does not match a route that only shares a path segment prefix', () => {
    // '/purchase/orders' must not swallow '/purchase/orders-archive'.
    expect(resolveRoutePermissions('/purchase/orders-archive', routes)).toBeUndefined()
  })

  it('never lets the dashboard root match every other route', () => {
    expect(resolveRoutePermissions('/', routes)?.moduleKey).toBe('dashboard')
    expect(resolveRoutePermissions('/quality/ipr', routes)).toBeUndefined()
  })
})

import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSidebarMenu } from '@/api/menus'
import type { ApiSidebarNode } from '@/types/api/rbac'
import {
  extractPermissionsFromSidebar,
  useModulePermission,
  usePermissionStore,
  useUserRoles,
} from './permissionStore'

vi.mock('@/api/menus', () => ({
  getSidebarMenu: vi.fn(),
}))

const mockSidebarNodes: ApiSidebarNode[] = [
  {
    id: 1,
    name: 'Procurement',
    icon: 'shopping-cart',
    route: null,
    module_key: null,
    sequence: 10,
    can: { read: true, write: false, modify: false, delete: false, approve: false },
    children: [
      {
        id: 2,
        name: 'Purchase Orders',
        icon: null,
        route: '/purchase/orders',
        module_key: 'purchase-orders',
        sequence: 1,
        can: { read: true, write: true, modify: true, delete: false, approve: true },
        children: [],
      },
      {
        id: 3,
        name: 'Purchase Requisitions',
        icon: null,
        route: '/purchase/requisitions',
        module_key: 'purchase-requisitions',
        sequence: 2,
        can: { read: true, write: true, modify: false, delete: false, approve: false },
        children: [],
      },
    ],
  },
]

describe('permissionStore', () => {
  beforeEach(() => {
    vi.mocked(getSidebarMenu).mockReset()
    usePermissionStore.getState().clearPermissions()
  })

  it('starts with default empty state', () => {
    const state = usePermissionStore.getState()
    expect(state.sidebarTree).toEqual([])
    expect(state.modulePermissions).toEqual({})
    expect(state.routePermissions).toEqual({})
    expect(state.userRoles).toEqual([])
    expect(state.userPermissions).toEqual([])
    expect(state.isLoaded).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.lastFetched).toBeNull()
  })

  it('extractPermissionsFromSidebar flattens tree into module and route maps', () => {
    const { modulePermissions, routePermissions } = extractPermissionsFromSidebar(mockSidebarNodes)

    expect(modulePermissions['purchase-orders']).toBeDefined()
    expect(modulePermissions['purchase-orders'].name).toBe('Purchase Orders')
    expect(modulePermissions['purchase-orders'].can.approve).toBe(true)
    expect(modulePermissions['purchase-orders'].can.delete).toBe(false)

    expect(modulePermissions['purchase-requisitions']).toBeDefined()
    expect(modulePermissions['purchase-requisitions'].can.approve).toBe(false)

    // Route mapped by MODULE_PAGES
    expect(routePermissions['/purchase/orders']).toBeDefined()
    expect(routePermissions['/purchase/requisitions']).toBeDefined()
  })

  it('setSidebarData populates sidebarTree and permissions maps', () => {
    usePermissionStore.getState().setSidebarData(mockSidebarNodes)

    const state = usePermissionStore.getState()
    expect(state.isLoaded).toBe(true)
    expect(state.sidebarTree).toEqual(mockSidebarNodes)
    expect(state.modulePermissions['purchase-orders']).toBeDefined()
    expect(state.canApprove('purchase-orders')).toBe(true)
    expect(state.canDelete('purchase-orders')).toBe(false)
    expect(state.canRead('purchase-requisitions')).toBe(true)
    expect(state.canApprove('purchase-requisitions')).toBe(false)
  })

  it('setUserRoles and user role helpers work correctly', () => {
    usePermissionStore.getState().setUserRoles(['admin', 'procurement_manager'])

    expect(usePermissionStore.getState().userRoles).toEqual(['admin', 'procurement_manager'])
    expect(usePermissionStore.getState().hasRole('admin')).toBe(true)
    expect(usePermissionStore.getState().hasRole('inventory_clerk')).toBe(false)
    expect(usePermissionStore.getState().hasAnyRole(['sales', 'admin'])).toBe(true)
    expect(usePermissionStore.getState().hasAnyRole(['sales', 'hr'])).toBe(false)
  })

  it('setUserPermissions updates permission tokens', () => {
    usePermissionStore.getState().setUserPermissions(['create_po', 'approve_po'])
    expect(usePermissionStore.getState().userPermissions).toEqual(['create_po', 'approve_po'])
  })

  it('fetchSidebarData returns cached data when already loaded', async () => {
    usePermissionStore.getState().setSidebarData(mockSidebarNodes)

    const data = await usePermissionStore.getState().fetchSidebarData(false)
    expect(data).toEqual(mockSidebarNodes)
    expect(getSidebarMenu).not.toHaveBeenCalled()
  })

  it('fetchSidebarData calls API when not loaded or force=true', async () => {
    vi.mocked(getSidebarMenu).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: mockSidebarNodes,
    })

    const data = await usePermissionStore.getState().fetchSidebarData(true)
    expect(getSidebarMenu).toHaveBeenCalledTimes(1)
    expect(data).toEqual(mockSidebarNodes)
    expect(usePermissionStore.getState().isLoaded).toBe(true)
    expect(usePermissionStore.getState().canApprove('purchase-orders')).toBe(true)
  })

  it('refreshPermissions forces API call and updates store', async () => {
    vi.mocked(getSidebarMenu).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: mockSidebarNodes,
    })

    await usePermissionStore.getState().refreshPermissions()
    expect(getSidebarMenu).toHaveBeenCalledTimes(1)
    expect(usePermissionStore.getState().isLoaded).toBe(true)
  })

  it('clearPermissions resets the entire state', () => {
    usePermissionStore.getState().setSidebarData(mockSidebarNodes)
    usePermissionStore.getState().setUserRoles(['admin'])
    usePermissionStore.getState().clearPermissions()

    const state = usePermissionStore.getState()
    expect(state.sidebarTree).toEqual([])
    expect(state.modulePermissions).toEqual({})
    expect(state.userRoles).toEqual([])
    expect(state.isLoaded).toBe(false)
  })

  it('useModulePermission hook returns reactive module permissions', () => {
    usePermissionStore.getState().setSidebarData(mockSidebarNodes)

    const { result } = renderHook(() => useModulePermission('purchase-orders'))
    expect(result.current.canRead).toBe(true)
    expect(result.current.canWrite).toBe(true)
    expect(result.current.canApprove).toBe(true)
    expect(result.current.canDelete).toBe(false)
  })

  it('useModulePermission returns false for unknown modules', () => {
    const { result } = renderHook(() => useModulePermission('non-existent-module'))
    expect(result.current.canRead).toBe(false)
    expect(result.current.canApprove).toBe(false)
  })

  it('useUserRoles hook provides roles and check helper', () => {
    usePermissionStore.getState().setUserRoles(['manager'])
    const { result } = renderHook(() => useUserRoles())

    expect(result.current.roles).toEqual(['manager'])
    expect(result.current.hasRole('manager')).toBe(true)
    expect(result.current.hasRole('admin')).toBe(false)
  })
})

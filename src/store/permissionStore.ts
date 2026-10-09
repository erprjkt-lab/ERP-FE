import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSidebarMenu } from '@/api/menus'
import { MODULE_PAGES } from '@/layouts/sidebarNav'
import type { ApiSidebarNode } from '@/types/api/rbac'

export type ModuleAction = 'read' | 'write' | 'modify' | 'delete' | 'approve'

export interface ModuleActionPermissions {
  read: boolean
  write: boolean
  modify: boolean
  delete: boolean
  approve: boolean
}

export interface ModulePermissions {
  id: number
  name: string
  moduleKey: string
  route: string | null
  icon: string | null
  can: ModuleActionPermissions
}

export interface PermissionState {
  // Raw sidebar menu tree from the backend
  sidebarTree: ApiSidebarNode[]

  // Fast lookups indexed by module_key (e.g. 'purchase-orders', 'purchase-requisitions')
  modulePermissions: Record<string, ModulePermissions>

  // Lookups indexed by frontend route path (e.g. '/purchase/orders')
  routePermissions: Record<string, ModulePermissions>

  // Authenticated user's assigned roles and flat permission tokens
  userRoles: string[]
  userPermissions: string[]

  // Loading and lifecycle state
  isLoaded: boolean
  isLoading: boolean
  lastFetched: number | null
  error: string | null

  // State mutators
  setSidebarData: (nodes: ApiSidebarNode[]) => void
  setUserRoles: (roles: string[]) => void
  setUserPermissions: (permissions: string[]) => void
  fetchSidebarData: (force?: boolean) => Promise<ApiSidebarNode[]>
  refreshPermissions: () => Promise<void>
  clearPermissions: () => void

  // Selectors / helper query methods
  getModulePermissions: (moduleKey: string) => ModulePermissions | undefined
  getRoutePermissions: (path: string) => ModulePermissions | undefined
  can: (moduleKey: string, action: ModuleAction) => boolean
  canRead: (moduleKey: string) => boolean
  canWrite: (moduleKey: string) => boolean
  canModify: (moduleKey: string) => boolean
  canDelete: (moduleKey: string) => boolean
  canApprove: (moduleKey: string) => boolean
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasPermission: (permission: string) => boolean
}

/**
 * Traverses the sidebar node hierarchy recursively to build O(1) module-wise
 * and route-wise permission maps.
 */
export function extractPermissionsFromSidebar(
  nodes: ApiSidebarNode[],
  modulePagesMap: Record<string, { path: string; label: string }[]> = MODULE_PAGES,
): {
  modulePermissions: Record<string, ModulePermissions>
  routePermissions: Record<string, ModulePermissions>
} {
  const modulePermissions: Record<string, ModulePermissions> = {}
  const routePermissions: Record<string, ModulePermissions> = {}

  function traverse(list: ApiSidebarNode[]) {
    for (const node of list) {
      if (node.module_key) {
        const item: ModulePermissions = {
          id: node.id,
          name: node.name,
          moduleKey: node.module_key,
          route: node.route,
          icon: node.icon,
          can: {
            read: Boolean(node.can?.read),
            write: Boolean(node.can?.write),
            modify: Boolean(node.can?.modify),
            delete: Boolean(node.can?.delete),
            approve: Boolean(node.can?.approve),
          },
        }
        modulePermissions[node.module_key] = item

        // Map by direct backend route if specified
        if (node.route) {
          routePermissions[node.route] = item
        }

        // Map by frontend route definitions
        const pages = modulePagesMap[node.module_key] ?? []
        for (const page of pages) {
          routePermissions[page.path] = item
        }
      }

      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }

  traverse(nodes)
  return { modulePermissions, routePermissions }
}

const DEFAULT_STATE = {
  sidebarTree: [] as ApiSidebarNode[],
  modulePermissions: {} as Record<string, ModulePermissions>,
  routePermissions: {} as Record<string, ModulePermissions>,
  userRoles: [] as string[],
  userPermissions: [] as string[],
  isLoaded: false,
  isLoading: false,
  lastFetched: null as number | null,
  error: null as string | null,
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setSidebarData: (nodes: ApiSidebarNode[]) => {
        const { modulePermissions, routePermissions } = extractPermissionsFromSidebar(nodes)
        set({
          sidebarTree: nodes,
          modulePermissions,
          routePermissions,
          isLoaded: true,
          lastFetched: Date.now(),
          error: null,
        })
      },

      setUserRoles: (roles: string[]) => set({ userRoles: roles }),

      setUserPermissions: (permissions: string[]) => set({ userPermissions: permissions }),

      fetchSidebarData: async (force = false) => {
        const state = get()
        // If already loaded into cache and force refresh is not requested, return existing
        if (!force && state.isLoaded && state.sidebarTree.length > 0) {
          return state.sidebarTree
        }

        set({ isLoading: true, error: null })
        try {
          const response = await getSidebarMenu()
          const nodes = response.data ?? []
          const { modulePermissions, routePermissions } = extractPermissionsFromSidebar(nodes)
          set({
            sidebarTree: nodes,
            modulePermissions,
            routePermissions,
            isLoading: false,
            isLoaded: true,
            lastFetched: Date.now(),
            error: null,
          })
          return nodes
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch sidebar permissions'
          set({ isLoading: false, error: msg })
          return state.sidebarTree
        }
      },

      refreshPermissions: async () => {
        await get().fetchSidebarData(true)
      },

      clearPermissions: () => {
        set({
          ...DEFAULT_STATE,
        })
      },

      getModulePermissions: (moduleKey: string) => {
        return get().modulePermissions[moduleKey]
      },

      getRoutePermissions: (path: string) => {
        return get().routePermissions[path]
      },

      can: (moduleKey: string, action: ModuleAction) => {
        const mod = get().modulePermissions[moduleKey]
        return Boolean(mod?.can?.[action])
      },

      canRead: (moduleKey: string) => {
        return Boolean(get().modulePermissions[moduleKey]?.can?.read)
      },

      canWrite: (moduleKey: string) => {
        return Boolean(get().modulePermissions[moduleKey]?.can?.write)
      },

      canModify: (moduleKey: string) => {
        return Boolean(get().modulePermissions[moduleKey]?.can?.modify)
      },

      canDelete: (moduleKey: string) => {
        return Boolean(get().modulePermissions[moduleKey]?.can?.delete)
      },

      canApprove: (moduleKey: string) => {
        return Boolean(get().modulePermissions[moduleKey]?.can?.approve)
      },

      hasRole: (role: string) => {
        return get().userRoles.includes(role)
      },

      hasAnyRole: (roles: string[]) => {
        const userRoles = get().userRoles
        return roles.some(role => userRoles.includes(role))
      },

      hasPermission: (permission: string) => {
        return get().userPermissions.includes(permission)
      },
    }),
    {
      name: 'erp-permissions',
      partialize: state => ({
        sidebarTree: state.sidebarTree,
        modulePermissions: state.modulePermissions,
        routePermissions: state.routePermissions,
        userRoles: state.userRoles,
        userPermissions: state.userPermissions,
        isLoaded: state.isLoaded,
        lastFetched: state.lastFetched,
      }),
    },
  ),
)

/**
 * Hook for consuming granular module permissions directly inside components and pages.
 *
 * Example:
 * ```tsx
 * const { canApprove, canWrite, canRead } = useModulePermission('purchase-orders')
 * if (canApprove) {
 *   return <Button>Approve</Button>
 * }
 * ```
 */
export function useModulePermission(moduleKey: string) {
  const perm = usePermissionStore(state => state.modulePermissions[moduleKey])
  const isLoading = usePermissionStore(state => state.isLoading)
  const isLoaded = usePermissionStore(state => state.isLoaded)

  return {
    permissions: perm,
    canRead: perm?.can.read ?? false,
    canWrite: perm?.can.write ?? false,
    canModify: perm?.can.modify ?? false,
    canDelete: perm?.can.delete ?? false,
    canApprove: perm?.can.approve ?? false,
    isLoading,
    isLoaded,
  }
}

/**
 * Hook for accessing the current user's roles and checking role membership.
 */
export function useUserRoles() {
  const roles = usePermissionStore(state => state.userRoles)
  const hasRole = usePermissionStore(state => state.hasRole)
  const hasAnyRole = usePermissionStore(state => state.hasAnyRole)

  return {
    roles,
    hasRole,
    hasAnyRole,
  }
}

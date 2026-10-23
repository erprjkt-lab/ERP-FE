import { useLocation } from 'react-router-dom'
import { MODULE_PAGES } from '@/layouts/sidebarNav'
import { usePermissionStore } from '@/store/permissionStore'
import type { ModuleAction, ModulePermissions } from '@/store/permissionStore'

export interface PagePermission {
  /** The rbac module backing this screen, or undefined when none maps to it. */
  moduleKey: string | undefined
  canRead: boolean
  canWrite: boolean
  canModify: boolean
  canDelete: boolean
  canApprove: boolean
  can: (action: ModuleAction) => boolean
  /** False until GET /menus/sidebar has landed — buttons should wait, not flash. */
  isLoaded: boolean
  /** True only for the known-ungoverned screens listed below, which stay open.
   *  A route whose module the user simply wasn't granted is NOT ungoverned. */
  isUngoverned: boolean
}

/**
 * Longest-prefix match of a pathname against the route→module map the sidebar
 * built. List routes ARE the keys ('/purchase/orders'), and every detail/new/edit
 * screen sits under one ('/purchase/orders/12/edit'), so the prefix walk resolves
 * the whole module without each page naming its own key.
 */
export function resolveRoutePermissions(
  pathname: string,
  routePermissions: Record<string, ModulePermissions>,
): ModulePermissions | undefined {
  let best: ModulePermissions | undefined
  let bestLength = -1

  for (const [route, perm] of Object.entries(routePermissions)) {
    // '/' would otherwise prefix-match every route and win nothing but confusion.
    const matches =
      route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)
    if (matches && route.length > bestLength) {
      best = perm
      bestLength = route.length
    }
  }

  return best
}

/**
 * The only screens allowed to run without a permission module behind them: they
 * have no entry in ERP-BE's config/rbac_modules.php, so the backend grants
 * nothing for them and the sidebar reports nothing. Hiding their buttons would
 * break the screens without securing anything.
 *
 * This is an explicit list and not "whatever the sidebar didn't mention",
 * because MenuService::buildBranch drops any node the user can't read — so a
 * module the user was *denied* looks exactly like one that doesn't exist.
 * Treating the two alike opened every button on a denied screen. Add a key here
 * only when ERP-BE genuinely has no module for it; once it gains one, delete the
 * entry and the screen starts obeying its permissions.
 */
const UNGOVERNED_MODULES = [
  'consumables',
  'machines',
  'gauge-instruments',
  'packing-materials',
  'rejection-reasons',
] as const

const UNGOVERNED_ROUTES = UNGOVERNED_MODULES.flatMap(key =>
  (MODULE_PAGES[key] ?? []).map(page => page.path),
)

/**
 * What the current route's user may do here. Drives which action buttons render.
 *
 * Three outcomes: the route has a module and the user's grants on it decide;
 * the route is one of the UNGOVERNED_ROUTES above and everything stays open; or
 * the route has a module the user wasn't granted, in which case nothing renders.
 */
export function usePagePermission(): PagePermission {
  const { pathname } = useLocation()
  const routePermissions = usePermissionStore(state => state.routePermissions)
  const isLoaded = usePermissionStore(state => state.isLoaded)

  const perm = resolveRoutePermissions(pathname, routePermissions)
  const isUngoverned =
    isLoaded &&
    !perm &&
    UNGOVERNED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))

  const allow = (action: ModuleAction) => (perm ? perm.can[action] : isUngoverned)

  return {
    moduleKey: perm?.moduleKey,
    canRead: allow('read'),
    canWrite: allow('write'),
    canModify: allow('modify'),
    canDelete: allow('delete'),
    canApprove: allow('approve'),
    can: allow,
    isLoaded,
    isUngoverned,
  }
}

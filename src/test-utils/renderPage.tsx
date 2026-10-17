import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { App as AntApp } from 'antd'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MODULE_PAGES } from '@/layouts/sidebarNav'
import { usePermissionStore } from '@/store/permissionStore'
import type { ModulePermissions } from '@/store/permissionStore'

const ALL_ACTIONS = { read: true, write: true, modify: true, delete: true, approve: true }
const NO_ACTIONS = { read: false, write: false, modify: false, delete: false, approve: false }

/**
 * Pages hide their action buttons unless the permission store says the user may
 * use them, and that store is normally filled by the sidebar query in AppLayout
 * — which page tests don't render. Seed it here so a page test exercises a
 * fully-permitted user by default, and pass `permissions` to test a restricted
 * one.
 */
function seedPermissions(paths: string[], granted: Partial<typeof ALL_ACTIONS> | 'all') {
  const can = granted === 'all' ? ALL_ACTIONS : { ...NO_ACTIONS, ...granted }
  const entry = (moduleKey: string): ModulePermissions => ({
    id: 1,
    name: moduleKey,
    moduleKey,
    route: null,
    icon: null,
    can,
  })

  const modulePermissions: Record<string, ModulePermissions> = {}
  const routePermissions: Record<string, ModulePermissions> = {}

  for (const [moduleKey, pages] of Object.entries(MODULE_PAGES)) {
    modulePermissions[moduleKey] = entry(moduleKey)
    for (const page of pages) routePermissions[page.path] = modulePermissions[moduleKey]
  }
  // Whatever route this test renders at, so usePagePermission resolves there too.
  for (const path of paths) routePermissions[path] = entry('test-route')

  usePermissionStore.setState({ modulePermissions, routePermissions, isLoaded: true })
}

export function renderPage(
  ui: ReactElement,
  {
    path = '/',
    initialEntries = ['/'],
    permissions = 'all',
  }: {
    path?: string
    initialEntries?: string[]
    /** 'all' (the default) or the subset of actions this user holds. */
    permissions?: Partial<typeof ALL_ACTIONS> | 'all'
  } = {},
) {
  seedPermissions(initialEntries.map(String), permissions)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AntApp>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        </MemoryRouter>
      </AntApp>
    </QueryClientProvider>,
  )
}

// AntD's accessible-name computation is unreliable across successive renders
// within the same test file under jsdom — query by literal text/icon class
// and walk up to the <button> instead of relying on the computed name.
export function buttonByText(text: string): HTMLElement {
  const el = screen.getByText(text).closest('button')
  if (!el) throw new Error(`No <button> ancestor found for text "${text}"`)
  return el as HTMLElement
}

export function iconButton(iconName: string): HTMLElement {
  const icon = document.querySelector(`.anticon-${iconName}`)
  const el = icon?.closest('button')
  if (!el) throw new Error(`No <button> ancestor found for icon "${iconName}"`)
  return el as HTMLElement
}

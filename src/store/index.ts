import { create } from 'zustand'

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>(set => ({
  // Desktop-only: whether the sidebar is the narrow icon rail. The mobile nav
  // drawer keeps its own open/closed state inside AppLayout — sharing this one
  // meant a visit to mobile width silently collapsed the desktop sidebar.
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
}))

export * from './authStore'
export * from './permissionStore'

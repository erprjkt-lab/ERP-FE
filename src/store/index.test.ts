import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './index'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().setSidebarCollapsed(false)
  })

  it('starts with the sidebar expanded', () => {
    expect(useAppStore.getState().sidebarCollapsed).toBe(false)
  })

  it('toggleSidebar flips the collapsed state', () => {
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarCollapsed).toBe(true)
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarCollapsed).toBe(false)
  })

  it('setSidebarCollapsed sets an explicit value', () => {
    useAppStore.getState().setSidebarCollapsed(true)
    expect(useAppStore.getState().sidebarCollapsed).toBe(true)
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'
import type { ApiMenu } from '@/types/api/rbac'

vi.mock('@/api/menus', () => ({
  getSidebarMenu: vi.fn(),
  listMenus: vi.fn(),
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  deleteMenu: vi.fn(),
}))

import { createMenu, deleteMenu, getSidebarMenu, listMenus, updateMenu } from '@/api/menus'
import { useCreateMenu, useDeleteMenu, useMenus, useSidebarMenu, useUpdateMenu } from './useMenus'

const apiMenu: ApiMenu = {
  id: 1,
  parent_id: null,
  name: 'HR',
  icon: 'fa-users',
  route: '/hr',
  permission_name: null,
  sequence: 1,
  is_active: true,
}

describe('useMenus hooks', () => {
  beforeEach(() => {
    vi.mocked(getSidebarMenu).mockReset()
    vi.mocked(listMenus).mockReset()
    vi.mocked(createMenu).mockReset()
    vi.mocked(updateMenu).mockReset()
    vi.mocked(deleteMenu).mockReset()
  })

  it('useSidebarMenu returns the raw sidebar tree', async () => {
    vi.mocked(getSidebarMenu).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiMenu],
    })
    const { result } = renderHook(() => useSidebarMenu(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual([apiMenu])
  })

  it('useMenus returns the flat menu list', async () => {
    vi.mocked(listMenus).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiMenu],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })
    const { result } = renderHook(() => useMenus(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual([apiMenu])
  })

  it('useCreateMenu delegates to the create API', async () => {
    vi.mocked(createMenu).mockResolvedValue({ status: 'success', message: 'ok', data: apiMenu })
    const { result } = renderHook(() => useCreateMenu(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ name: 'HR' })
    })
    expect(createMenu).toHaveBeenCalledWith({ name: 'HR' })
  })

  it('useUpdateMenu delegates to the update API with id + payload', async () => {
    vi.mocked(updateMenu).mockResolvedValue({ status: 'success', message: 'ok', data: apiMenu })
    const { result } = renderHook(() => useUpdateMenu(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 1, payload: { name: 'HR Renamed' } })
    })
    expect(updateMenu).toHaveBeenCalledWith(1, { name: 'HR Renamed' })
  })

  it('useDeleteMenu delegates to the delete API', async () => {
    vi.mocked(deleteMenu).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteMenu(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync(1)
    })
    expect(deleteMenu).toHaveBeenCalledWith(1)
  })
})

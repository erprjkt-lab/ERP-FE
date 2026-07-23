import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'
import type { ApiRole } from '@/types/api/rbac'

vi.mock('@/api/roles', () => ({
  listRoles: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  syncRolePermissions: vi.fn(),
  deleteRole: vi.fn(),
}))

import { createRole, deleteRole, listRoles, syncRolePermissions, updateRole } from '@/api/roles'
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
  useSyncRolePermissions,
  useUpdateRole,
} from './useRoles'

const apiRole: ApiRole = {
  id: 1,
  name: 'Manager',
  guard_name: 'api',
  permissions: ['view employees'],
}

describe('useRoles hooks', () => {
  beforeEach(() => {
    vi.mocked(listRoles).mockReset()
    vi.mocked(createRole).mockReset()
    vi.mocked(updateRole).mockReset()
    vi.mocked(syncRolePermissions).mockReset()
    vi.mocked(deleteRole).mockReset()
  })

  it('useRoles returns the role list', async () => {
    vi.mocked(listRoles).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiRole],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })
    const { result } = renderHook(() => useRoles(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual([apiRole])
  })

  it('useCreateRole delegates to the create API', async () => {
    vi.mocked(createRole).mockResolvedValue({ status: 'success', message: 'ok', data: apiRole })
    const { result } = renderHook(() => useCreateRole(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ name: 'Manager' })
    })
    expect(createRole).toHaveBeenCalledWith({ name: 'Manager' })
  })

  it('useUpdateRole delegates to the update API', async () => {
    vi.mocked(updateRole).mockResolvedValue({ status: 'success', message: 'ok', data: apiRole })
    const { result } = renderHook(() => useUpdateRole(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 1, payload: { name: 'Senior Manager' } })
    })
    expect(updateRole).toHaveBeenCalledWith(1, { name: 'Senior Manager' })
  })

  it('useSyncRolePermissions delegates to the sync API', async () => {
    vi.mocked(syncRolePermissions).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiRole,
    })
    const { result } = renderHook(() => useSyncRolePermissions(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 1, payload: { permissions: ['view employees'] } })
    })
    expect(syncRolePermissions).toHaveBeenCalledWith(1, { permissions: ['view employees'] })
  })

  it('useDeleteRole delegates to the delete API', async () => {
    vi.mocked(deleteRole).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteRole(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync(1)
    })
    expect(deleteRole).toHaveBeenCalledWith(1)
  })
})

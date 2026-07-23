import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'
import type { ApiPermission } from '@/types/api/rbac'

vi.mock('@/api/permissions', () => ({
  listPermissions: vi.fn(),
  createPermission: vi.fn(),
  deletePermission: vi.fn(),
}))

import { createPermission, deletePermission, listPermissions } from '@/api/permissions'
import { useCreatePermission, useDeletePermission, usePermissions } from './usePermissions'

const apiPermission: ApiPermission = { id: 1, name: 'view employees', guard_name: 'api' }

describe('usePermissions hooks', () => {
  beforeEach(() => {
    vi.mocked(listPermissions).mockReset()
    vi.mocked(createPermission).mockReset()
    vi.mocked(deletePermission).mockReset()
  })

  it('usePermissions returns the permission list', async () => {
    vi.mocked(listPermissions).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiPermission],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })
    const { result } = renderHook(() => usePermissions(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual([apiPermission])
  })

  it('useCreatePermission delegates to the create API', async () => {
    vi.mocked(createPermission).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiPermission,
    })
    const { result } = renderHook(() => useCreatePermission(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ name: 'view employees' })
    })
    expect(createPermission).toHaveBeenCalledWith({ name: 'view employees' })
  })

  it('useDeletePermission delegates to the delete API', async () => {
    vi.mocked(deletePermission).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeletePermission(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync(1)
    })
    expect(deletePermission).toHaveBeenCalledWith(1)
  })
})

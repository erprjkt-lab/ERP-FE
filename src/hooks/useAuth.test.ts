import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import { createQueryWrapper } from '@/test-utils/queryWrapper'
import type { AuthUser } from '@/types/api/auth'

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
}))

import { login, logout, me } from '@/api/auth'
import { useLogin, useLogout, useMe } from './useAuth'

const sampleUser: AuthUser = {
  id: 1,
  employee_code: 'EMP-0001',
  employee_name: 'Admin',
  name: 'Admin',
  gender: null,
  date_of_birth: null,
  branch: 0,
  department_id: 0,
  designation_id: 0,
  shift_id: 0,
  joining_date: null,
  employee_type: null,
  status: 'active',
  role: null,
  email: 'admin@example.com',
  username: 'admin',
  phone_number: null,
  roles: [],
  permissions: [],
  created_at: null,
  created_by: null,
  updated_by: null,
}

describe('useMe', () => {
  beforeEach(() => {
    vi.mocked(me).mockReset()
    useAuthStore.getState().clear()
  })

  it('does not fetch when there is no token', () => {
    renderHook(() => useMe(), { wrapper: createQueryWrapper() })
    expect(me).not.toHaveBeenCalled()
  })

  it('fetches the profile once a token is present', async () => {
    vi.mocked(me).mockResolvedValue({ status: 'success', message: 'ok', data: sampleUser })
    useAuthStore.getState().setToken('a-token')

    const { result } = renderHook(() => useMe(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data).toEqual(sampleUser)
  })
})

describe('useLogin', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
    useAuthStore.getState().clear()
  })

  it('stores the returned token in the auth store on success', async () => {
    vi.mocked(login).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: { token: 'fresh-token', token_type: 'Bearer', employee: sampleUser },
    })

    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ email: 'admin@example.com', password: 'password' })
    })

    expect(useAuthStore.getState().token).toBe('fresh-token')
  })

  it('does not touch the store when login rejects', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useLogin(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await expect(
        result.current.mutateAsync({ email: 'admin@example.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid credentials')
    })

    expect(useAuthStore.getState().token).toBeNull()
  })
})

describe('useLogout', () => {
  beforeEach(() => {
    vi.mocked(logout).mockReset()
    useAuthStore.getState().clear()
  })

  it('clears the auth store once the logout request settles', async () => {
    useAuthStore.getState().setToken('stale-token')
    vi.mocked(logout).mockResolvedValue(undefined)

    const { result } = renderHook(() => useLogout(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(useAuthStore.getState().token).toBeNull()
  })

  it('clears the auth store even if the logout request fails (onSettled, not onSuccess)', async () => {
    useAuthStore.getState().setToken('stale-token')
    vi.mocked(logout).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLogout(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('Network error')
    })

    expect(useAuthStore.getState().token).toBeNull()
  })
})

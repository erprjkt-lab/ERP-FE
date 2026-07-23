import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './authStore'
import type { AuthUser } from '@/types/api/auth'

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

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clear()
  })

  it('starts with no token and no user', () => {
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setToken stores the token', () => {
    useAuthStore.getState().setToken('abc123')
    expect(useAuthStore.getState().token).toBe('abc123')
  })

  it('setUser stores the user', () => {
    useAuthStore.getState().setUser(sampleUser)
    expect(useAuthStore.getState().user).toEqual(sampleUser)
  })

  it('clear resets both token and user', () => {
    useAuthStore.getState().setToken('abc123')
    useAuthStore.getState().setUser(sampleUser)
    useAuthStore.getState().clear()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setUser(null) clears just the user', () => {
    useAuthStore.getState().setToken('abc123')
    useAuthStore.getState().setUser(sampleUser)
    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBe('abc123')
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'
import type { ApiDepartment, ApiDesignation, ApiEmployee, ApiShift } from '@/types/api/hr'

vi.mock('@/api/employees', () => ({
  listEmployees: vi.fn(),
  getEmployee: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
  syncEmployeeRoles: vi.fn(),
}))
vi.mock('@/api/departments', () => ({
  listDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
}))
vi.mock('@/api/designations', () => ({
  listDesignations: vi.fn(),
  createDesignation: vi.fn(),
  updateDesignation: vi.fn(),
  deleteDesignation: vi.fn(),
}))
vi.mock('@/api/shifts', () => ({
  listShifts: vi.fn(),
  createShift: vi.fn(),
  updateShift: vi.fn(),
  deleteShift: vi.fn(),
}))

import { listDepartments } from '@/api/departments'
import { listDesignations } from '@/api/designations'
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  syncEmployeeRoles,
  updateEmployee,
} from '@/api/employees'
import { listShifts } from '@/api/shifts'
import { useHRLocalStore } from '../store/hrLocalStore'
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployee,
  useEmployees,
  useUpdateEmployee,
} from './useEmployees'

const apiDept: ApiDepartment = {
  id: 1,
  name: 'Engineering',
  description: null,
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}
const apiDesignation: ApiDesignation = {
  id: 2,
  name: 'Senior Engineer',
  description: null,
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}
const apiShift: ApiShift = {
  id: 3,
  shift_name: 'Morning Shift',
  shift_start: '09:00',
  shift_end: '18:00',
  lunch_start: '13:00',
  lunch_end: '13:30',
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}

const apiEmployee: ApiEmployee = {
  id: 100,
  employee_code: 'EMP-0100',
  employee_name: null,
  name: 'Jane Doe',
  gender: null,
  date_of_birth: null,
  branch: 0,
  department_id: 1,
  designation_id: 2,
  shift_id: 3,
  joining_date: null,
  employee_type: null,
  status: null,
  role: null,
  email: 'jane@example.com',
  username: 'jane',
  phone_number: '9876543210',
  roles: ['Manager'],
  permissions: [],
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}

function mockLookups() {
  vi.mocked(listDepartments).mockResolvedValue({
    status: 'success',
    message: 'ok',
    data: [apiDept],
    meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
  })
  vi.mocked(listDesignations).mockResolvedValue({
    status: 'success',
    message: 'ok',
    data: [apiDesignation],
    meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
  })
  vi.mocked(listShifts).mockResolvedValue({
    status: 'success',
    message: 'ok',
    data: [apiShift],
    meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
  })
}

describe('useEmployees', () => {
  beforeEach(() => {
    vi.mocked(listEmployees).mockReset()
    vi.mocked(getEmployee).mockReset()
    vi.mocked(createEmployee).mockReset()
    vi.mocked(updateEmployee).mockReset()
    vi.mocked(deleteEmployee).mockReset()
    vi.mocked(syncEmployeeRoles).mockReset()
    vi.mocked(listDepartments).mockReset()
    vi.mocked(listDesignations).mockReset()
    vi.mocked(listShifts).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })
    mockLookups()
  })

  it('composes department/designation/shift joins onto each employee', async () => {
    vi.mocked(listEmployees).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiEmployee],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useEmployees(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    const employee = result.current.data?.[0]
    expect(employee?.department?.name).toBe('Engineering')
    expect(employee?.designation?.title).toBe('Senior Engineer')
    expect(employee?.shift?.name).toBe('Morning Shift')
  })

  it('prefers employee_code, falling back to a formatted code, and prefers employee_name over name', async () => {
    vi.mocked(listEmployees).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [{ ...apiEmployee, employee_code: null, employee_name: 'Preferred Name' }],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useEmployees(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.[0].employeeId).toBe('EMP-0100')
    expect(result.current.data?.[0].fullName).toBe('Preferred Name')
  })

  it('defaults status to active and currency to INR when not set', async () => {
    vi.mocked(listEmployees).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiEmployee],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useEmployees(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.[0].status).toBe('active')
    expect(result.current.data?.[0].currency).toBe('INR')
  })

  it('falls back to the first Spatie role when api.role is not set', async () => {
    vi.mocked(listEmployees).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiEmployee],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useEmployees(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.[0].role).toBe('Manager')
  })

  it('merges in local-only extras (salary/currency/location)', async () => {
    useHRLocalStore.getState().setEmployeeExtra('100', {
      salary: 75000,
      currency: 'USD',
      location: 'Remote',
    })
    vi.mocked(listEmployees).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiEmployee],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useEmployees(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.[0]).toMatchObject({
      salary: 75000,
      currency: 'USD',
      location: 'Remote',
    })
  })
})

describe('useEmployee', () => {
  beforeEach(() => {
    vi.mocked(getEmployee).mockReset()
    vi.mocked(listDepartments).mockReset()
    vi.mocked(listDesignations).mockReset()
    vi.mocked(listShifts).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })
    mockLookups()
  })

  it('is disabled (does not fetch) when id is undefined', () => {
    renderHook(() => useEmployee(undefined), { wrapper: createQueryWrapper() })
    expect(getEmployee).not.toHaveBeenCalled()
  })

  it('fetches and composes a single employee by id', async () => {
    vi.mocked(getEmployee).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })
    const { result } = renderHook(() => useEmployee('100'), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.fullName).toBe('Jane Doe')
    expect(getEmployee).toHaveBeenCalledWith(100)
  })
})

describe('employee mutations', () => {
  beforeEach(() => {
    vi.mocked(createEmployee).mockReset()
    vi.mocked(updateEmployee).mockReset()
    vi.mocked(deleteEmployee).mockReset()
    vi.mocked(syncEmployeeRoles).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })
  })

  it('useCreateEmployee stores extras locally and syncs the role when given', async () => {
    vi.mocked(createEmployee).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })
    vi.mocked(syncEmployeeRoles).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })

    const { result } = renderHook(() => useCreateEmployee(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({
        payload: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          username: 'jane',
          phone_number: '9876543210',
          password: 'secret123',
        },
        extra: { salary: 75000 },
        role: 'Manager',
      })
    })

    expect(useHRLocalStore.getState().employeeExtras['100']).toEqual({ salary: 75000 })
    expect(syncEmployeeRoles).toHaveBeenCalledWith(100, { roles: ['Manager'] })
  })

  it('useCreateEmployee does not call syncEmployeeRoles when no role is given', async () => {
    vi.mocked(createEmployee).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })

    const { result } = renderHook(() => useCreateEmployee(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({
        payload: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          username: 'jane',
          phone_number: '9876543210',
          password: 'secret123',
        },
        extra: {},
      })
    })

    expect(syncEmployeeRoles).not.toHaveBeenCalled()
  })

  it('useUpdateEmployee calls updateEmployee with id/payload and stores extras', async () => {
    vi.mocked(updateEmployee).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })

    const { result } = renderHook(() => useUpdateEmployee(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({
        id: 100,
        payload: { name: 'Jane Renamed' },
        extra: { location: 'Pune' },
      })
    })

    expect(updateEmployee).toHaveBeenCalledWith(100, { name: 'Jane Renamed' })
    expect(useHRLocalStore.getState().employeeExtras['100']).toEqual({ location: 'Pune' })
  })

  it('useDeleteEmployee removes the local extras for the deleted employee', async () => {
    useHRLocalStore.getState().setEmployeeExtra('100', { salary: 1000 })
    vi.mocked(deleteEmployee).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteEmployee(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync(100)
    })

    expect(deleteEmployee).toHaveBeenCalledWith(100)
    expect(useHRLocalStore.getState().employeeExtras['100']).toBeUndefined()
  })
})

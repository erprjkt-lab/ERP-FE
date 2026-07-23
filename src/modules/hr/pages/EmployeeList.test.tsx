import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderPage } from '@/test-utils/renderPage'
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
import { listEmployees } from '@/api/employees'
import { listShifts } from '@/api/shifts'
import { useHRLocalStore } from '../store/hrLocalStore'
import { useHRStore } from '../store/hrStore'
import { EmployeeList } from './EmployeeList'

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

function apiEmployee(overrides: Partial<ApiEmployee> = {}): ApiEmployee {
  return {
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
    ...overrides,
  }
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

describe('EmployeeList page', () => {
  beforeEach(() => {
    vi.mocked(listEmployees).mockReset()
    vi.mocked(listDepartments).mockReset()
    vi.mocked(listDesignations).mockReset()
    vi.mocked(listShifts).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })
    useHRStore.getState().resetFilters()
    mockLookups()
  })

  it('renders employee rows with name, department, and status', async () => {
    vi.mocked(listEmployees).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiEmployee()],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    renderPage(<EmployeeList />)

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('EMP-0100')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('filters rows by search text', async () => {
    const user = userEvent.setup()
    vi.mocked(listEmployees).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [
        apiEmployee(),
        apiEmployee({ id: 101, employee_code: 'EMP-0101', name: 'Beta Person' }),
      ],
      meta: { current_page: 1, per_page: 100, total: 2, last_page: 1 },
    })

    renderPage(<EmployeeList />)

    expect(await screen.findByText('2 of 2 employees')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Search by name or ID...'), 'Beta')
    expect(await screen.findByText('1 of 2 employees')).toBeInTheDocument()
    expect(screen.getByText('Beta Person')).toBeInTheDocument()
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
  })

  it('clears filters via the Clear filters button', async () => {
    const user = userEvent.setup()
    vi.mocked(listEmployees).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [
        apiEmployee(),
        apiEmployee({ id: 101, employee_code: 'EMP-0101', name: 'Beta Person' }),
      ],
      meta: { current_page: 1, per_page: 100, total: 2, last_page: 1 },
    })

    renderPage(<EmployeeList />)

    await user.type(await screen.findByPlaceholderText('Search by name or ID...'), 'Beta')
    await screen.findByText('1 of 2 employees')
    await user.click(screen.getByText('Clear filters'))
    await waitFor(() => expect(screen.getByText('2 of 2 employees')).toBeInTheDocument())
  })
})

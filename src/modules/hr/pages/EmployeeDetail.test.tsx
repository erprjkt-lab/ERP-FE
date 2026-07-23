import { screen } from '@testing-library/react'
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
import { getEmployee } from '@/api/employees'
import { listShifts } from '@/api/shifts'
import { useHRLocalStore } from '../store/hrLocalStore'
import { EmployeeDetail } from './EmployeeDetail'

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

describe('EmployeeDetail page', () => {
  beforeEach(() => {
    vi.mocked(getEmployee).mockReset()
    vi.mocked(listDepartments).mockReset()
    vi.mocked(listDesignations).mockReset()
    vi.mocked(listShifts).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })
    mockLookups()
  })

  it('shows a not-found message for an unknown id', async () => {
    vi.mocked(getEmployee).mockRejectedValue(new Error('not found'))
    renderPage(<EmployeeDetail />, {
      path: '/hr/employees/:id',
      initialEntries: ['/hr/employees/missing'],
    })
    expect(await screen.findByText('Employee not found.')).toBeInTheDocument()
  })

  it('renders the employee name, id, department, and designation', async () => {
    vi.mocked(getEmployee).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })
    renderPage(<EmployeeDetail />, {
      path: '/hr/employees/:id',
      initialEntries: ['/hr/employees/100'],
    })

    expect(await screen.findByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument()
    expect(screen.getAllByText('EMP-0100').length).toBeGreaterThan(0)
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
  })
})

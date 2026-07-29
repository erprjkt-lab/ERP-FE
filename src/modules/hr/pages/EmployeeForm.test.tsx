import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buttonByText, renderPage } from '@/test-utils/renderPage'
import type { ApiDepartment, ApiDesignation, ApiEmployee, ApiShift } from '@/types/api/hr'
import type { ApiRole } from '@/types/api/rbac'

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
vi.mock('@/api/roles', () => ({
  listRoles: vi.fn(),
  getRole: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  syncRolePermissions: vi.fn(),
  deleteRole: vi.fn(),
}))

import { listDepartments } from '@/api/departments'
import { listDesignations } from '@/api/designations'
import { createEmployee, getEmployee, updateEmployee } from '@/api/employees'
import { listRoles } from '@/api/roles'
import { listShifts } from '@/api/shifts'
import { useHRLocalStore } from '../store/hrLocalStore'
import { EmployeeForm } from './EmployeeForm'

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
const apiRole: ApiRole = { id: 5, name: 'Manager', guard_name: 'web' }

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
  vi.mocked(listRoles).mockResolvedValue({
    status: 'success',
    message: 'ok',
    data: [apiRole],
    meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
  })
}

describe('EmployeeForm page — create mode', () => {
  beforeEach(() => {
    vi.mocked(createEmployee).mockReset()
    vi.mocked(updateEmployee).mockReset()
    vi.mocked(getEmployee).mockReset()
    vi.mocked(listDepartments).mockReset()
    vi.mocked(listDesignations).mockReset()
    vi.mocked(listShifts).mockReset()
    vi.mocked(listRoles).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })
    mockLookups()
  })

  it('renders the Add Employee title and Save Employee action', async () => {
    renderPage(<EmployeeForm />)
    expect(screen.getByRole('heading', { name: 'Add Employee' })).toBeInTheDocument()
    expect(buttonByText('Save Employee')).toBeInTheDocument()
    expect(screen.queryByLabelText('Employee Code')).not.toBeInTheDocument()
  })

  it('creates an employee with the required fields', async () => {
    const user = userEvent.setup()
    vi.mocked(createEmployee).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })

    renderPage(<EmployeeForm />)

    await user.type(await screen.findByLabelText('Employee Name'), 'New Person')
    await user.type(screen.getByLabelText('Mobile Number'), '9876543210')
    await user.type(screen.getByLabelText('Email'), 'new@company.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')

    await user.click(buttonByText('Save Employee'))

    await waitFor(() => expect(createEmployee).toHaveBeenCalled())
    expect(createEmployee).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Person',
        phone_number: '9876543210',
        email: 'new@company.com',
        password: 'secret123',
      }),
    )
  })

  it('does not submit when required fields are missing', async () => {
    const user = userEvent.setup()
    renderPage(<EmployeeForm />)
    await user.click(buttonByText('Save Employee'))
    expect(createEmployee).not.toHaveBeenCalled()
  })
})

describe('EmployeeForm page — edit mode', () => {
  beforeEach(() => {
    vi.mocked(createEmployee).mockReset()
    vi.mocked(updateEmployee).mockReset()
    vi.mocked(getEmployee).mockReset()
    vi.mocked(listDepartments).mockReset()
    vi.mocked(listDesignations).mockReset()
    vi.mocked(listShifts).mockReset()
    vi.mocked(listRoles).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })
    mockLookups()
    vi.mocked(getEmployee).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })
  })

  it('pre-fills the form and shows a disabled Employee Code field', async () => {
    renderPage(<EmployeeForm />, {
      path: '/hr/employees/:id/edit',
      initialEntries: ['/hr/employees/100/edit'],
    })

    const nameField = await screen.findByLabelText('Employee Name')
    await waitFor(() => expect(nameField).toHaveValue('Jane Doe'))
    expect(screen.getByLabelText('Employee Code')).toBeDisabled()
    expect(screen.getByLabelText('Employee Code')).toHaveValue('EMP-0100')
  })

  it('updates the employee in the store', async () => {
    const user = userEvent.setup()
    vi.mocked(updateEmployee).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiEmployee,
    })

    renderPage(<EmployeeForm />, {
      path: '/hr/employees/:id/edit',
      initialEntries: ['/hr/employees/100/edit'],
    })

    const nameInput = await screen.findByLabelText('Employee Name')
    // Wait for the async getEmployee fetch to resolve and pre-fill the form
    // before interacting — otherwise the fill can land mid-keystroke and get
    // stomped by the effect that populates the form once data arrives.
    await waitFor(() => expect(nameInput).toHaveValue('Jane Doe'))
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Renamed')
    await user.click(buttonByText('Update Employee'))

    await waitFor(() => expect(updateEmployee).toHaveBeenCalled())
    expect(updateEmployee).toHaveBeenCalledWith(
      100,
      expect.objectContaining({ name: 'Jane Renamed' }),
    )
  })
})

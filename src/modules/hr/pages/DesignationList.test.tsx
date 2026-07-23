import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buttonByText, renderPage } from '@/test-utils/renderPage'
import type { ApiDepartment, ApiDesignation } from '@/types/api/hr'

vi.mock('@/api/designations', () => ({
  listDesignations: vi.fn(),
  createDesignation: vi.fn(),
  updateDesignation: vi.fn(),
  deleteDesignation: vi.fn(),
}))
vi.mock('@/api/departments', () => ({
  listDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
}))

import { listDepartments } from '@/api/departments'
import { createDesignation, listDesignations } from '@/api/designations'
import { useHRLocalStore } from '../store/hrLocalStore'
import { DesignationList } from './DesignationList'

const apiDept: ApiDepartment = {
  id: 1,
  name: 'Engineering',
  description: null,
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}
const apiDesignation: ApiDesignation = {
  id: 10,
  name: 'Senior Engineer',
  description: null,
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}

describe('DesignationList page', () => {
  beforeEach(() => {
    vi.mocked(listDesignations).mockReset()
    vi.mocked(createDesignation).mockReset()
    vi.mocked(listDepartments).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })

    vi.mocked(listDepartments).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiDept],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })
  })

  it('renders the resolved department name alongside the designation title', async () => {
    useHRLocalStore.getState().setDesignationExtra('10', { departmentId: '1' })
    vi.mocked(listDesignations).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiDesignation],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    renderPage(<DesignationList />)
    expect(await screen.findByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
  })

  it('creates a designation and stores its department link locally', async () => {
    const user = userEvent.setup()
    vi.mocked(listDesignations).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [],
      meta: { current_page: 1, per_page: 100, total: 0, last_page: 1 },
    })
    vi.mocked(createDesignation).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiDesignation,
    })

    renderPage(<DesignationList />)
    await waitFor(() =>
      expect(document.querySelector('.ant-empty-description')).toBeInTheDocument(),
    )
    await user.click(buttonByText('Add Designation'))
    await user.type(screen.getByLabelText('Designation Title'), 'Senior Engineer')
    await user.click(screen.getByLabelText('Department'))
    await user.click(await screen.findByText('Engineering'))
    await user.click(buttonByText('OK'))

    await waitFor(() => expect(createDesignation).toHaveBeenCalledWith({ name: 'Senior Engineer' }))
    expect(useHRLocalStore.getState().designationExtras['10']).toEqual({ departmentId: '1' })
  })
})

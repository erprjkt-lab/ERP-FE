import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buttonByText, renderPage } from '@/test-utils/renderPage'
import type { ApiDepartment } from '@/types/api/hr'

vi.mock('@/api/departments', () => ({
  listDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
}))

import { createDepartment, listDepartments } from '@/api/departments'
import { DepartmentList } from './DepartmentList'

const apiDept: ApiDepartment = {
  id: 1,
  name: 'Engineering',
  description: null,
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}

describe('DepartmentList page', () => {
  beforeEach(() => {
    vi.mocked(listDepartments).mockReset()
    vi.mocked(createDepartment).mockReset()
  })

  it('renders departments from the API', async () => {
    vi.mocked(listDepartments).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiDept],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    renderPage(<DepartmentList />)
    expect(await screen.findByText('Engineering')).toBeInTheDocument()
  })

  it('creates a department through the modal', async () => {
    const user = userEvent.setup()
    vi.mocked(listDepartments).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [],
      meta: { current_page: 1, per_page: 100, total: 0, last_page: 1 },
    })
    vi.mocked(createDepartment).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiDept,
    })

    renderPage(<DepartmentList />)
    await waitFor(() =>
      expect(document.querySelector('.ant-empty-description')).toBeInTheDocument(),
    )
    await user.click(buttonByText('Add Department'))
    await user.type(screen.getByLabelText('Department Name'), 'Engineering')
    await user.click(buttonByText('OK'))

    await waitFor(() => expect(createDepartment).toHaveBeenCalledWith({ name: 'Engineering' }))
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'
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
import {
  createDesignation,
  deleteDesignation,
  listDesignations,
  updateDesignation,
} from '@/api/designations'
import { useHRLocalStore } from '../store/hrLocalStore'
import {
  useCreateDesignation,
  useDeleteDesignation,
  useDesignations,
  useUpdateDesignation,
} from './useDesignations'

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

describe('useDesignations', () => {
  beforeEach(() => {
    vi.mocked(listDesignations).mockReset()
    vi.mocked(createDesignation).mockReset()
    vi.mocked(updateDesignation).mockReset()
    vi.mocked(deleteDesignation).mockReset()
    vi.mocked(listDepartments).mockReset()
    useHRLocalStore.setState({ employeeExtras: {}, designationExtras: {} })

    vi.mocked(listDepartments).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiDept],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })
  })

  it('resolves the department link from local storage, since the API has no such column', async () => {
    useHRLocalStore.getState().setDesignationExtra('10', { departmentId: '1' })
    vi.mocked(listDesignations).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiDesignation],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useDesignations(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.[0]).toMatchObject({
      id: '10',
      title: 'Senior Engineer',
      departmentId: '1',
    })
    expect(result.current.data?.[0].department?.name).toBe('Engineering')
  })

  it('leaves departmentId/department undefined when no local link is set', async () => {
    vi.mocked(listDesignations).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiDesignation],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useDesignations(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.[0].departmentId).toBeNull()
    expect(result.current.data?.[0].department).toBeUndefined()
  })

  it('useCreateDesignation calls the API and stores the department link locally', async () => {
    vi.mocked(createDesignation).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiDesignation,
    })

    const { result } = renderHook(() => useCreateDesignation(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ payload: { name: 'Senior Engineer' }, departmentId: '1' })
    })

    expect(createDesignation).toHaveBeenCalledWith({ name: 'Senior Engineer' })
    expect(useHRLocalStore.getState().designationExtras['10']).toEqual({ departmentId: '1' })
  })

  it('useUpdateDesignation updates the local department link', async () => {
    vi.mocked(updateDesignation).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiDesignation,
    })

    const { result } = renderHook(() => useUpdateDesignation(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({
        id: 10,
        payload: { name: 'Staff Engineer' },
        departmentId: '2',
      })
    })

    expect(updateDesignation).toHaveBeenCalledWith(10, { name: 'Staff Engineer' })
    expect(useHRLocalStore.getState().designationExtras['10']).toEqual({ departmentId: '2' })
  })

  it('useDeleteDesignation removes the local department link', async () => {
    useHRLocalStore.getState().setDesignationExtra('10', { departmentId: '1' })
    vi.mocked(deleteDesignation).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteDesignation(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync(10)
    })

    expect(deleteDesignation).toHaveBeenCalledWith(10)
    expect(useHRLocalStore.getState().designationExtras['10']).toBeUndefined()
  })
})

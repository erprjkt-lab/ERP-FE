import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'
import type { ApiDepartment } from '@/types/api/hr'

vi.mock('@/api/departments', () => ({
  listDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  deleteDepartment: vi.fn(),
}))

import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '@/api/departments'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from './useDepartments'

const apiDept: ApiDepartment = {
  id: 1,
  name: 'Engineering',
  description: null,
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}

describe('useDepartments', () => {
  beforeEach(() => {
    vi.mocked(listDepartments).mockReset()
    vi.mocked(createDepartment).mockReset()
    vi.mocked(updateDepartment).mockReset()
    vi.mocked(deleteDepartment).mockReset()
  })

  it('maps the raw API department into the UI Department shape', async () => {
    vi.mocked(listDepartments).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiDept],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useDepartments(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data).toEqual([
      {
        id: '1',
        name: 'Engineering',
        code: 'ENG',
        managerId: null,
        parentId: null,
        headCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ])
  })

  it('derives a 3-letter uppercase code from the department name', async () => {
    vi.mocked(listDepartments).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [{ ...apiDept, name: 'human resources' }],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useDepartments(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data?.[0].code).toBe('HUM')
  })

  it('useCreateDepartment calls the create API with the given payload', async () => {
    vi.mocked(createDepartment).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiDept,
    })

    const { result } = renderHook(() => useCreateDepartment(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ name: 'Engineering' })
    })

    expect(createDepartment).toHaveBeenCalledWith({ name: 'Engineering' })
  })

  it('useUpdateDepartment calls the update API with id and payload', async () => {
    vi.mocked(updateDepartment).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: apiDept,
    })

    const { result } = renderHook(() => useUpdateDepartment(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 1, payload: { name: 'Engineering Renamed' } })
    })

    expect(updateDepartment).toHaveBeenCalledWith(1, { name: 'Engineering Renamed' })
  })

  it('useDeleteDepartment calls the delete API with the id', async () => {
    vi.mocked(deleteDepartment).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteDepartment(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync(1)
    })

    expect(deleteDepartment).toHaveBeenCalledWith(1)
  })
})

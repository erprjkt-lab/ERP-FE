import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'
import type { ApiShift } from '@/types/api/hr'

vi.mock('@/api/shifts', () => ({
  listShifts: vi.fn(),
  createShift: vi.fn(),
  updateShift: vi.fn(),
  deleteShift: vi.fn(),
}))

import { createShift, deleteShift, listShifts, updateShift } from '@/api/shifts'
import { useCreateShift, useDeleteShift, useShifts, useUpdateShift } from './useShifts'

const apiShift: ApiShift = {
  id: 1,
  shift_name: 'Morning Shift',
  shift_start: '09:00',
  shift_end: '18:00',
  lunch_start: '13:00',
  lunch_end: '13:30',
  created_at: '2024-01-01T00:00:00.000Z',
  created_by: null,
  updated_by: null,
}

describe('useShifts', () => {
  beforeEach(() => {
    vi.mocked(listShifts).mockReset()
    vi.mocked(createShift).mockReset()
    vi.mocked(updateShift).mockReset()
    vi.mocked(deleteShift).mockReset()
  })

  it('maps the raw API shift into the UI Shift shape (snake_case -> camelCase)', async () => {
    vi.mocked(listShifts).mockResolvedValue({
      status: 'success',
      message: 'ok',
      data: [apiShift],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
    })

    const { result } = renderHook(() => useShifts(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data).toEqual([
      {
        id: '1',
        name: 'Morning Shift',
        startTime: '09:00',
        endTime: '18:00',
        lunchStartTime: '13:00',
        lunchEndTime: '13:30',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ])
  })

  it('useCreateShift calls the create API with the raw snake_case payload', async () => {
    vi.mocked(createShift).mockResolvedValue({ status: 'success', message: 'ok', data: apiShift })
    const { result } = renderHook(() => useCreateShift(), { wrapper: createQueryWrapper() })
    const payload = {
      shift_name: 'Morning Shift',
      shift_start: '09:00',
      shift_end: '18:00',
      lunch_start: '13:00',
      lunch_end: '13:30',
    }
    await act(async () => {
      await result.current.mutateAsync(payload)
    })
    expect(createShift).toHaveBeenCalledWith(payload)
  })

  it('useUpdateShift calls the update API with id and payload', async () => {
    vi.mocked(updateShift).mockResolvedValue({ status: 'success', message: 'ok', data: apiShift })
    const { result } = renderHook(() => useUpdateShift(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync({ id: 1, payload: { shift_name: 'Renamed Shift' } })
    })
    expect(updateShift).toHaveBeenCalledWith(1, { shift_name: 'Renamed Shift' })
  })

  it('useDeleteShift calls the delete API with the id', async () => {
    vi.mocked(deleteShift).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteShift(), { wrapper: createQueryWrapper() })
    await act(async () => {
      await result.current.mutateAsync(1)
    })
    expect(deleteShift).toHaveBeenCalledWith(1)
  })
})

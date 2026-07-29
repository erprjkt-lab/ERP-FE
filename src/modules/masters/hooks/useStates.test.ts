import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'

vi.mock('@/api/world', () => ({
  listCountries: vi.fn(),
  listStates: vi.fn(),
  listCities: vi.fn(),
}))

import { listStates } from '@/api/world'
import { useStates } from './useStates'

describe('useStates', () => {
  beforeEach(() => {
    vi.mocked(listStates).mockReset()
  })

  it('does not fetch when no countryId is given', () => {
    const { result } = renderHook(() => useStates(undefined), { wrapper: createQueryWrapper() })
    expect(result.current.data).toEqual([])
    expect(listStates).not.toHaveBeenCalled()
  })

  it('fetches states scoped to the given countryId', async () => {
    vi.mocked(listStates).mockResolvedValue({
      success: true,
      message: 'states',
      data: [{ id: 1660, name: 'Maharashtra' }],
    })

    const { result } = renderHook(() => useStates('102'), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual([{ id: 1660, name: 'Maharashtra' }])
    expect(listStates).toHaveBeenCalledWith(102)
  })
})

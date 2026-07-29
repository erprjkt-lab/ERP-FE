import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'

vi.mock('@/api/world', () => ({
  listCountries: vi.fn(),
  listStates: vi.fn(),
  listCities: vi.fn(),
}))

import { listCities } from '@/api/world'
import { useCities } from './useCities'

describe('useCities', () => {
  beforeEach(() => {
    vi.mocked(listCities).mockReset()
  })

  it('does not fetch when no stateId is given', () => {
    const { result } = renderHook(() => useCities(undefined), { wrapper: createQueryWrapper() })
    expect(result.current.data).toEqual([])
    expect(listCities).not.toHaveBeenCalled()
  })

  it('fetches cities scoped to the given stateId', async () => {
    vi.mocked(listCities).mockResolvedValue({
      success: true,
      message: 'cities',
      data: [{ id: 46728, name: 'Mumbai' }],
    })

    const { result } = renderHook(() => useCities('1660'), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual([{ id: 46728, name: 'Mumbai' }])
    expect(listCities).toHaveBeenCalledWith(1660)
  })
})

import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQueryWrapper } from '@/test-utils/queryWrapper'

vi.mock('@/api/world', () => ({
  listCountries: vi.fn(),
  listStates: vi.fn(),
  listCities: vi.fn(),
}))

import { listCountries } from '@/api/world'
import { useCountries } from './useCountries'

describe('useCountries', () => {
  beforeEach(() => {
    vi.mocked(listCountries).mockReset()
  })

  it('fetches countries from the world API', async () => {
    vi.mocked(listCountries).mockResolvedValue({
      success: true,
      message: 'countries',
      data: [{ id: 102, name: 'India' }],
    })

    const { result } = renderHook(() => useCountries(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual([{ id: 102, name: 'India' }])
    expect(listCountries).toHaveBeenCalled()
  })
})

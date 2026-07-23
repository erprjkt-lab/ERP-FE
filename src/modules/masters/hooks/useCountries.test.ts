import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetMastersStore } from '../testUtils'
import { useCountries, useCreateCountry, useDeleteCountry, useUpdateCountry } from './useCountries'

describe('useCountries', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useCountries())
    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('reflects a country created via useCreateCountry', async () => {
    const { result: create } = renderHook(() => useCreateCountry())
    await act(async () => {
      await create.current.mutateAsync({ name: 'India' })
    })

    const { result: list } = renderHook(() => useCountries())
    expect(list.current.data).toHaveLength(1)
    expect(list.current.data[0].name).toBe('India')
  })

  it('reflects an update via useUpdateCountry', async () => {
    const { result: create } = renderHook(() => useCreateCountry())
    let id = ''
    await act(async () => {
      id = (await create.current.mutateAsync({ name: 'India' })).id
    })

    const { result: update } = renderHook(() => useUpdateCountry())
    await act(async () => {
      await update.current.mutateAsync({ id, payload: { name: 'Bharat' } })
    })

    const { result: list } = renderHook(() => useCountries())
    expect(list.current.data[0].name).toBe('Bharat')
  })

  it('reflects a delete via useDeleteCountry', async () => {
    const { result: create } = renderHook(() => useCreateCountry())
    let id = ''
    await act(async () => {
      id = (await create.current.mutateAsync({ name: 'India' })).id
    })

    const { result: del } = renderHook(() => useDeleteCountry())
    await act(async () => {
      await del.current.mutateAsync(id)
    })

    const { result: list } = renderHook(() => useCountries())
    expect(list.current.data).toHaveLength(0)
  })
})

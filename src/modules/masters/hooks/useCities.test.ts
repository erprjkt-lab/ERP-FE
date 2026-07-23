import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { useCities, useCreateCity, useDeleteCity, useUpdateCity } from './useCities'

describe('useCities', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('resolves the linked state (which itself resolves its country)', async () => {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Maharashtra', countryId: country.id })

    const { result: create } = renderHook(() => useCreateCity())
    await act(async () => {
      await create.current.mutateAsync({ name: 'Mumbai', stateId: state.id })
    })

    const { result } = renderHook(() => useCities())
    expect(result.current.data[0].state?.name).toBe('Maharashtra')
    expect(result.current.data[0].state?.country?.name).toBe('India')
  })

  it('leaves state undefined when stateId is null', async () => {
    const { result: create } = renderHook(() => useCreateCity())
    await act(async () => {
      await create.current.mutateAsync({ name: 'Nowhere City', stateId: null })
    })

    const { result } = renderHook(() => useCities())
    expect(result.current.data[0].state).toBeUndefined()
  })

  it('reflects an update via useUpdateCity', async () => {
    const city = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: null })
    const { result: update } = renderHook(() => useUpdateCity())
    await act(async () => {
      await update.current.mutateAsync({
        id: city.id,
        payload: { name: 'Greater Mumbai', stateId: null },
      })
    })

    const { result } = renderHook(() => useCities())
    expect(result.current.data[0].name).toBe('Greater Mumbai')
  })

  it('reflects a delete via useDeleteCity', async () => {
    const city = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: null })
    const { result: del } = renderHook(() => useDeleteCity())
    await act(async () => {
      await del.current.mutateAsync(city.id)
    })

    const { result } = renderHook(() => useCities())
    expect(result.current.data).toHaveLength(0)
  })
})

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { useCreateState, useDeleteState, useStates, useUpdateState } from './useStates'

describe('useStates', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('resolves the linked country onto each state', async () => {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const { result: create } = renderHook(() => useCreateState())
    await act(async () => {
      await create.current.mutateAsync({ name: 'Maharashtra', countryId: country.id })
    })

    const { result } = renderHook(() => useStates())
    expect(result.current.data[0].country?.name).toBe('India')
  })

  it('leaves country undefined when countryId is null', async () => {
    const { result: create } = renderHook(() => useCreateState())
    await act(async () => {
      await create.current.mutateAsync({ name: 'Nowhereland', countryId: null })
    })

    const { result } = renderHook(() => useStates())
    expect(result.current.data[0].country).toBeUndefined()
  })

  it('re-resolves the country after updateState changes the link', async () => {
    const india = useMastersStore.getState().createCountry({ name: 'India' })
    const usa = useMastersStore.getState().createCountry({ name: 'USA' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Border State', countryId: india.id })

    const { result: update } = renderHook(() => useUpdateState())
    await act(async () => {
      await update.current.mutateAsync({
        id: state.id,
        payload: { name: state.name, countryId: usa.id },
      })
    })

    const { result } = renderHook(() => useStates())
    expect(result.current.data[0].country?.name).toBe('USA')
  })

  it('reflects a delete via useDeleteState', async () => {
    const state = useMastersStore.getState().createState({ name: 'Maharashtra', countryId: null })
    const { result: del } = renderHook(() => useDeleteState())
    await act(async () => {
      await del.current.mutateAsync(state.id)
    })

    const { result } = renderHook(() => useStates())
    expect(result.current.data).toHaveLength(0)
  })
})

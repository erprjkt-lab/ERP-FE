import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { useLocationLookups } from './useLocationLookups'

describe('useLocationLookups', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('returns empty maps when there is no location data', () => {
    const { result } = renderHook(() => useLocationLookups())
    expect(result.current.countryById.size).toBe(0)
    expect(result.current.stateById.size).toBe(0)
    expect(result.current.cityById.size).toBe(0)
    expect(result.current.isLoading).toBe(false)
  })

  it('builds id-keyed maps for each level', () => {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Maharashtra', countryId: country.id })
    const city = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })

    const { result } = renderHook(() => useLocationLookups())
    expect(result.current.countryById.get(country.id)?.name).toBe('India')
    expect(result.current.stateById.get(state.id)?.name).toBe('Maharashtra')
    expect(result.current.cityById.get(city.id)?.name).toBe('Mumbai')
  })
})

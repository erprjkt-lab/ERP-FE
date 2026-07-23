import { useCities } from './useCities'
import { useCountries } from './useCountries'
import { useStates } from './useStates'

export function useLocationLookups() {
  const { data: countries, isLoading: countriesLoading } = useCountries()
  const { data: states, isLoading: statesLoading } = useStates()
  const { data: cities, isLoading: citiesLoading } = useCities()

  return {
    countryById: new Map(countries.map(c => [c.id, c])),
    stateById: new Map(states.map(s => [s.id, s])),
    cityById: new Map(cities.map(c => [c.id, c])),
    isLoading: countriesLoading || statesLoading || citiesLoading,
  }
}

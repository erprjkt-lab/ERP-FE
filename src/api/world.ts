import type { ApiCity, ApiCountry, ApiState, WorldListEnvelope } from '@/types/api/world'
import { apiRequest } from './client'

export function listCountries() {
  return apiRequest<WorldListEnvelope<ApiCountry>>('/api/countries')
}

export function listStates(countryId: number) {
  return apiRequest<WorldListEnvelope<ApiState>>('/api/states', {
    query: { 'filters[country_id]': countryId },
  })
}

export function listCities(stateId: number) {
  return apiRequest<WorldListEnvelope<ApiCity>>('/api/cities', {
    query: { 'filters[state_id]': stateId },
  })
}

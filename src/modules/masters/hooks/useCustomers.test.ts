import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { CustomerInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import {
  useCreateCustomer,
  useCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from './useCustomers'

const baseInput: CustomerInput = {
  name: 'Acme Corp',
  customerType: 'retail',
  status: 'active',
  contactPerson: 'Jane Doe',
  mobile: '9876543210',
  email: 'jane@acme.com',
  address: '123 Main St',
  countryId: null,
  stateId: null,
  cityId: null,
  pincode: '400001',
  gstType: null,
  creditLimit: 10000,
  creditDays: 30,
  openingBalance: 0,
  paymentTerms: null,
}

describe('useCustomers', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('stores the denormalized country/state/city names as given', async () => {
    const { result: create } = renderHook(() => useCreateCustomer())
    await act(async () => {
      await create.current.mutateAsync({
        ...baseInput,
        countryId: '102',
        countryName: 'India',
        stateId: '1660',
        stateName: 'Maharashtra',
        cityId: '46728',
        cityName: 'Mumbai',
      })
    })

    const { result } = renderHook(() => useCustomers())
    expect(result.current.data[0].countryName).toBe('India')
    expect(result.current.data[0].stateName).toBe('Maharashtra')
    expect(result.current.data[0].cityName).toBe('Mumbai')
  })

  it('assigns an auto-generated code visible through the composed record', async () => {
    const { result: create } = renderHook(() => useCreateCustomer())
    await act(async () => {
      await create.current.mutateAsync(baseInput)
    })

    const { result } = renderHook(() => useCustomers())
    expect(result.current.data[0].code).toBe('CUST-0001')
  })
})

describe('useCustomer', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('returns undefined when id is undefined', () => {
    const { result } = renderHook(() => useCustomer(undefined))
    expect(result.current.data).toBeUndefined()
  })

  it('returns undefined when no customer matches the id', () => {
    const { result } = renderHook(() => useCustomer('missing-id'))
    expect(result.current.data).toBeUndefined()
  })

  it('finds the matching customer by id', () => {
    const created = useMastersStore.getState().createCustomer(baseInput)
    const { result } = renderHook(() => useCustomer(created.id))
    expect(result.current.data?.name).toBe('Acme Corp')
  })

  it('reflects updates made via useUpdateCustomer', async () => {
    const created = useMastersStore.getState().createCustomer(baseInput)
    const { result: update } = renderHook(() => useUpdateCustomer())
    await act(async () => {
      await update.current.mutateAsync({ id: created.id, payload: { name: 'Renamed Co' } })
    })

    const { result } = renderHook(() => useCustomer(created.id))
    expect(result.current.data?.name).toBe('Renamed Co')
  })

  it('returns undefined after useDeleteCustomer removes the record', async () => {
    const created = useMastersStore.getState().createCustomer(baseInput)
    const { result: del } = renderHook(() => useDeleteCustomer())
    await act(async () => {
      await del.current.mutateAsync(created.id)
    })

    const { result } = renderHook(() => useCustomer(created.id))
    expect(result.current.data).toBeUndefined()
  })
})

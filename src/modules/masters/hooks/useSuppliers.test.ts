import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { SupplierInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSupplier,
  useSuppliers,
  useUpdateSupplier,
} from './useSuppliers'

const baseInput: SupplierInput = {
  name: 'Ganesh Suppliers',
  contactPerson: 'Ramesh',
  mobile: '9876543211',
  email: 'ramesh@ganesh.com',
  address: '456 Supplier Rd',
  countryId: null,
  stateId: null,
  cityId: null,
  pincode: '500001',
  paymentTerms: null,
  creditDays: 15,
  status: 'active',
}

describe('useSuppliers', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('stores the denormalized city name as given', async () => {
    const { result: create } = renderHook(() => useCreateSupplier())
    await act(async () => {
      await create.current.mutateAsync({ ...baseInput, cityId: '46727', cityName: 'Ahmedabad' })
    })

    const { result } = renderHook(() => useSuppliers())
    expect(result.current.data[0].cityName).toBe('Ahmedabad')
  })

  it('auto-generates a SUPP- code', async () => {
    const { result: create } = renderHook(() => useCreateSupplier())
    await act(async () => {
      await create.current.mutateAsync(baseInput)
    })

    const { result } = renderHook(() => useSuppliers())
    expect(result.current.data[0].code).toBe('SUPP-0001')
  })
})

describe('useSupplier', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('finds a supplier by id and reflects updates/deletes', async () => {
    const created = useMastersStore.getState().createSupplier(baseInput)
    expect(renderHook(() => useSupplier(created.id)).result.current.data?.name).toBe(
      'Ganesh Suppliers',
    )

    const { result: update } = renderHook(() => useUpdateSupplier())
    await act(async () => {
      await update.current.mutateAsync({ id: created.id, payload: { name: 'Renamed Supplier' } })
    })
    expect(renderHook(() => useSupplier(created.id)).result.current.data?.name).toBe(
      'Renamed Supplier',
    )

    const { result: del } = renderHook(() => useDeleteSupplier())
    await act(async () => {
      await del.current.mutateAsync(created.id)
    })
    expect(renderHook(() => useSupplier(created.id)).result.current.data).toBeUndefined()
  })
})

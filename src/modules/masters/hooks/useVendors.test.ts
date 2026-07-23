import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { VendorInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import {
  useCreateVendor,
  useDeleteVendor,
  useUpdateVendor,
  useVendor,
  useVendors,
} from './useVendors'

const baseInput: VendorInput = {
  name: 'Apex Vendor',
  vendorType: 'service',
  contactPerson: 'Vikram',
  mobile: '9876543212',
  email: 'vikram@apex.com',
  address: '789 Vendor Ln',
  countryId: null,
  stateId: null,
  cityId: null,
  pincode: '600001',
  status: 'active',
}

describe('useVendors', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('resolves the linked country/state/city onto each vendor', async () => {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const { result: create } = renderHook(() => useCreateVendor())
    await act(async () => {
      await create.current.mutateAsync({ ...baseInput, countryId: country.id })
    })

    const { result } = renderHook(() => useVendors())
    expect(result.current.data[0].country?.name).toBe('India')
  })

  it('auto-generates a VEND- code', async () => {
    const { result: create } = renderHook(() => useCreateVendor())
    await act(async () => {
      await create.current.mutateAsync(baseInput)
    })

    const { result } = renderHook(() => useVendors())
    expect(result.current.data[0].code).toBe('VEND-0001')
  })
})

describe('useVendor', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('finds a vendor by id and reflects updates/deletes', async () => {
    const created = useMastersStore.getState().createVendor(baseInput)
    expect(renderHook(() => useVendor(created.id)).result.current.data?.name).toBe('Apex Vendor')

    const { result: update } = renderHook(() => useUpdateVendor())
    await act(async () => {
      await update.current.mutateAsync({ id: created.id, payload: { status: 'inactive' } })
    })
    expect(renderHook(() => useVendor(created.id)).result.current.data?.status).toBe('inactive')

    const { result: del } = renderHook(() => useDeleteVendor())
    await act(async () => {
      await del.current.mutateAsync(created.id)
    })
    expect(renderHook(() => useVendor(created.id)).result.current.data).toBeUndefined()
  })
})

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderPage } from '@/test-utils/renderPage'
import type { VendorInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { VendorDetail } from './VendorDetail'

const baseInput: VendorInput = {
  name: 'Acme Corp',
  vendorType: 'service',
  status: 'active',
  contactPerson: 'Jane Doe',
  mobile: '9876543210',
  email: 'jane@acme.com',
  address: '123 Main St',
  countryId: null,
  stateId: null,
  cityId: null,
  pincode: '400001',
}

describe('VendorDetail page', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('shows a not-found message for an unknown id', () => {
    renderPage(<VendorDetail />, {
      path: '/masters/vendors/:id',
      initialEntries: ['/masters/vendors/missing'],
    })
    expect(screen.getByText('Vendor not found.')).toBeInTheDocument()
  })

  it('renders the vendor name, code, and basic info', () => {
    const vendor = useMastersStore.getState().createVendor(baseInput)
    renderPage(<VendorDetail />, {
      path: '/masters/vendors/:id',
      initialEntries: [`/masters/vendors/${vendor.id}`],
    })

    expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument()
    // "VEND-0001" legitimately appears twice: the page subtitle and the
    // Basic Info tab's own "Vendor Code" field.
    expect(screen.getAllByText('VEND-0001').length).toBeGreaterThan(0)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('9876543210')).toBeInTheDocument()
  })

  it('resolves and displays the linked city/state/country in the Address tab', async () => {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Maharashtra', countryId: country.id })
    const city = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })
    const vendor = useMastersStore.getState().createVendor({
      ...baseInput,
      countryId: country.id,
      stateId: state.id,
      cityId: city.id,
    })

    const user = userEvent.setup()
    renderPage(<VendorDetail />, {
      path: '/masters/vendors/:id',
      initialEntries: [`/masters/vendors/${vendor.id}`],
    })

    await user.click(screen.getByRole('tab', { name: 'Address' }))
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
    expect(screen.getByText('Maharashtra')).toBeInTheDocument()
    expect(screen.getByText('India')).toBeInTheDocument()
  })
})

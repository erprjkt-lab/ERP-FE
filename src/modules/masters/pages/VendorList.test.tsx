import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderPage } from '@/test-utils/renderPage'
import type { VendorInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { VendorList } from './VendorList'

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

describe('VendorList page', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('renders vendor rows with code, name, and status', () => {
    useMastersStore.getState().createVendor(baseInput)
    renderPage(<VendorList />)
    expect(screen.getByText('VEND-0001')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('filters rows by search text', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createVendor(baseInput)
    useMastersStore.getState().createVendor({ ...baseInput, name: 'Beta Traders' })
    renderPage(<VendorList />)

    expect(screen.getByText('2 of 2 vendors')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Search by name...'), 'Beta')
    expect(await screen.findByText('1 of 2 vendors')).toBeInTheDocument()
    expect(screen.getByText('Beta Traders')).toBeInTheDocument()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
  })

  it('clears filters via the Clear filters button', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createVendor(baseInput)
    useMastersStore.getState().createVendor({ ...baseInput, name: 'Beta Traders' })
    renderPage(<VendorList />)

    await user.type(screen.getByPlaceholderText('Search by name...'), 'Beta')
    await screen.findByText('1 of 2 vendors')
    await user.click(screen.getByText('Clear filters'))
    expect(await screen.findByText('2 of 2 vendors')).toBeInTheDocument()
  })
})

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderPage } from '@/test-utils/renderPage'
import type { CustomerInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { CustomerDetail } from './CustomerDetail'

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

describe('CustomerDetail page', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('shows a not-found message for an unknown id', () => {
    renderPage(<CustomerDetail />, {
      path: '/masters/customers/:id',
      initialEntries: ['/masters/customers/missing'],
    })
    expect(screen.getByText('Customer not found.')).toBeInTheDocument()
  })

  it('renders the customer name, code, and basic info', () => {
    const customer = useMastersStore.getState().createCustomer(baseInput)
    renderPage(<CustomerDetail />, {
      path: '/masters/customers/:id',
      initialEntries: [`/masters/customers/${customer.id}`],
    })

    expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument()
    // "CUST-0001" legitimately appears twice: the page subtitle and the
    // Basic Info tab's own "Customer Code" field.
    expect(screen.getAllByText('CUST-0001').length).toBeGreaterThan(0)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('9876543210')).toBeInTheDocument()
  })

  it('resolves and displays the linked city/state/country in the Address tab', async () => {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Maharashtra', countryId: country.id })
    const city = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })
    const customer = useMastersStore.getState().createCustomer({
      ...baseInput,
      countryId: country.id,
      stateId: state.id,
      cityId: city.id,
    })

    const user = userEvent.setup()
    renderPage(<CustomerDetail />, {
      path: '/masters/customers/:id',
      initialEntries: [`/masters/customers/${customer.id}`],
    })

    await user.click(screen.getByRole('tab', { name: 'Address' }))
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
    expect(screen.getByText('Maharashtra')).toBeInTheDocument()
    expect(screen.getByText('India')).toBeInTheDocument()
  })
})

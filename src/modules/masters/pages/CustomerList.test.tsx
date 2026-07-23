import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderPage } from '@/test-utils/renderPage'
import type { CustomerInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { CustomerList } from './CustomerList'

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

describe('CustomerList page', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('renders customer rows with code, name, and status', () => {
    useMastersStore.getState().createCustomer(baseInput)
    renderPage(<CustomerList />)
    expect(screen.getByText('CUST-0001')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('filters rows by search text', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createCustomer(baseInput)
    useMastersStore.getState().createCustomer({ ...baseInput, name: 'Beta Traders' })
    renderPage(<CustomerList />)

    expect(screen.getByText('2 of 2 customers')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Search by name...'), 'Beta')
    expect(await screen.findByText('1 of 2 customers')).toBeInTheDocument()
    expect(screen.getByText('Beta Traders')).toBeInTheDocument()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
  })

  it('clears filters via the Clear filters button', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createCustomer(baseInput)
    useMastersStore.getState().createCustomer({ ...baseInput, name: 'Beta Traders' })
    renderPage(<CustomerList />)

    await user.type(screen.getByPlaceholderText('Search by name...'), 'Beta')
    await screen.findByText('1 of 2 customers')
    await user.click(screen.getByText('Clear filters'))
    expect(await screen.findByText('2 of 2 customers')).toBeInTheDocument()
  })
})

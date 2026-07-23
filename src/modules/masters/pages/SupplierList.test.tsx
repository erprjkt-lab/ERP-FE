import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderPage } from '@/test-utils/renderPage'
import type { SupplierInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
import { SupplierList } from './SupplierList'

const baseInput: SupplierInput = {
  name: 'Acme Corp',
  status: 'active',
  contactPerson: 'Jane Doe',
  mobile: '9876543210',
  email: 'jane@acme.com',
  address: '123 Main St',
  countryId: null,
  stateId: null,
  cityId: null,
  pincode: '400001',
  creditDays: 30,
  paymentTerms: null,
}

describe('SupplierList page', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  it('renders supplier rows with code, name, and status', () => {
    useMastersStore.getState().createSupplier(baseInput)
    renderPage(<SupplierList />)
    expect(screen.getByText('SUPP-0001')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('filters rows by search text', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createSupplier(baseInput)
    useMastersStore.getState().createSupplier({ ...baseInput, name: 'Beta Traders' })
    renderPage(<SupplierList />)

    expect(screen.getByText('2 of 2 suppliers')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Search by name...'), 'Beta')
    expect(await screen.findByText('1 of 2 suppliers')).toBeInTheDocument()
    expect(screen.getByText('Beta Traders')).toBeInTheDocument()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
  })

  it('clears filters via the Clear filters button', async () => {
    const user = userEvent.setup()
    useMastersStore.getState().createSupplier(baseInput)
    useMastersStore.getState().createSupplier({ ...baseInput, name: 'Beta Traders' })
    renderPage(<SupplierList />)

    await user.type(screen.getByPlaceholderText('Search by name...'), 'Beta')
    await screen.findByText('1 of 2 suppliers')
    await user.click(screen.getByText('Clear filters'))
    expect(await screen.findByText('2 of 2 suppliers')).toBeInTheDocument()
  })
})

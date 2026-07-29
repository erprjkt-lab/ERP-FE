import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buttonByText, renderPage } from '@/test-utils/renderPage'
import type { CustomerInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'

vi.mock('@/api/world', () => ({
  listCountries: vi.fn(),
  listStates: vi.fn(),
  listCities: vi.fn(),
}))

import { listCities, listCountries, listStates } from '@/api/world'
import { CustomerForm } from './CustomerForm'

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

function mockWorldApi() {
  vi.mocked(listCountries).mockResolvedValue({
    success: true,
    message: 'countries',
    data: [{ id: 102, name: 'India' }],
  })
  vi.mocked(listStates).mockResolvedValue({
    success: true,
    message: 'states',
    data: [{ id: 1660, name: 'Maharashtra' }],
  })
  vi.mocked(listCities).mockResolvedValue({
    success: true,
    message: 'cities',
    data: [{ id: 46728, name: 'Mumbai' }],
  })
}

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, text: string) {
  await user.click(screen.getByLabelText(label))
  await user.click(await screen.findByText(text))
}

describe('CustomerForm page — create mode', () => {
  beforeEach(() => {
    resetMastersStore()
    vi.mocked(listCountries).mockReset()
    vi.mocked(listStates).mockReset()
    vi.mocked(listCities).mockReset()
    mockWorldApi()
  })

  it('renders section headings and the Save Customer action', () => {
    renderPage(<CustomerForm />)
    expect(screen.getByRole('heading', { name: 'Add Customer' })).toBeInTheDocument()
    expect(screen.getByText('Basic Info')).toBeInTheDocument()
    // "Address" also matches the field label, so scope to the section heading.
    expect(screen.getByRole('heading', { name: 'Address', level: 5 })).toBeInTheDocument()
    expect(screen.getByText('Tax & Compliance')).toBeInTheDocument()
    expect(screen.getByText('Financial Terms')).toBeInTheDocument()
    expect(screen.getByText('Banking')).toBeInTheDocument()
    expect(buttonByText('Save Customer')).toBeInTheDocument()
  })

  it('does not show a Customer Code field when creating', () => {
    renderPage(<CustomerForm />)
    expect(screen.queryByLabelText('Customer Code')).not.toBeInTheDocument()
  })

  it('creates a customer with cascading country/state/city selection', async () => {
    const user = userEvent.setup()

    renderPage(<CustomerForm />)

    await user.type(screen.getByLabelText('Customer Name'), 'New Co')
    await user.type(screen.getByLabelText('Contact Person'), 'John Smith')
    await user.type(screen.getByLabelText('Mobile'), '9876543210')
    await user.type(screen.getByLabelText('Email'), 'john@newco.com')
    await user.type(screen.getByLabelText('Address'), '99 New Street')

    await selectOption(user, 'Country', 'India')
    await selectOption(user, 'State', 'Maharashtra')
    await selectOption(user, 'City', 'Mumbai')

    await user.click(buttonByText('Save Customer'))

    await waitFor(() => expect(useMastersStore.getState().customers).toHaveLength(1))
    const created = useMastersStore.getState().customers[0]
    expect(created).toMatchObject({
      name: 'New Co',
      contactPerson: 'John Smith',
      mobile: '9876543210',
      email: 'john@newco.com',
      countryId: '102',
      countryName: 'India',
      stateId: '1660',
      stateName: 'Maharashtra',
      cityId: '46728',
      cityName: 'Mumbai',
    })
  })

  it('does not submit when required fields are missing', async () => {
    const user = userEvent.setup()
    renderPage(<CustomerForm />)
    await user.click(buttonByText('Save Customer'))
    expect(useMastersStore.getState().customers).toHaveLength(0)
  })
})

describe('CustomerForm page — edit mode', () => {
  beforeEach(() => {
    resetMastersStore()
    vi.mocked(listCountries).mockReset()
    vi.mocked(listStates).mockReset()
    vi.mocked(listCities).mockReset()
    mockWorldApi()
  })

  function createCustomerWithLocation() {
    return useMastersStore.getState().createCustomer({
      ...baseInput,
      countryId: '102',
      countryName: 'India',
      stateId: '1660',
      stateName: 'Maharashtra',
      cityId: '46728',
      cityName: 'Mumbai',
    })
  }

  it('pre-fills the form and shows a disabled Customer Code field', async () => {
    const customer = useMastersStore.getState().createCustomer(baseInput)
    renderPage(<CustomerForm />, {
      path: '/masters/customers/:id/edit',
      initialEntries: [`/masters/customers/${customer.id}/edit`],
    })

    expect(await screen.findByLabelText('Customer Name')).toHaveValue('Acme Corp')
    expect(screen.getByLabelText('Customer Code')).toBeDisabled()
    expect(screen.getByLabelText('Customer Code')).toHaveValue('CUST-0001')
  })

  it('updates the customer in the store', async () => {
    const user = userEvent.setup()
    const customer = createCustomerWithLocation()
    renderPage(<CustomerForm />, {
      path: '/masters/customers/:id/edit',
      initialEntries: [`/masters/customers/${customer.id}/edit`],
    })

    const nameInput = await screen.findByLabelText('Customer Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Acme Renamed')
    await user.click(buttonByText('Update Customer'))

    await waitFor(() => expect(useMastersStore.getState().customers[0].name).toBe('Acme Renamed'))
  })
})

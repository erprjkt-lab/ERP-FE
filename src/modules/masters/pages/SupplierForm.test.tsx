import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buttonByText, renderPage } from '@/test-utils/renderPage'
import type { SupplierInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'

vi.mock('@/api/world', () => ({
  listCountries: vi.fn(),
  listStates: vi.fn(),
  listCities: vi.fn(),
}))

import { listCities, listCountries, listStates } from '@/api/world'
import { SupplierForm } from './SupplierForm'

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

describe('SupplierForm page — create mode', () => {
  beforeEach(() => {
    resetMastersStore()
    vi.mocked(listCountries).mockReset()
    vi.mocked(listStates).mockReset()
    vi.mocked(listCities).mockReset()
    mockWorldApi()
  })

  it('renders section headings and the Save Supplier action', () => {
    renderPage(<SupplierForm />)
    expect(screen.getByRole('heading', { name: 'Add Supplier' })).toBeInTheDocument()
    expect(screen.getByText('Basic Info')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Address', level: 5 })).toBeInTheDocument()
    expect(screen.getByText('Tax & Terms')).toBeInTheDocument()
    expect(screen.getByText('Banking')).toBeInTheDocument()
    expect(buttonByText('Save Supplier')).toBeInTheDocument()
  })

  it('does not show a Supplier Code field when creating', () => {
    renderPage(<SupplierForm />)
    expect(screen.queryByLabelText('Supplier Code')).not.toBeInTheDocument()
  })

  it('creates a supplier with cascading country/state/city selection', async () => {
    const user = userEvent.setup()

    renderPage(<SupplierForm />)

    await user.type(screen.getByLabelText('Supplier Name'), 'New Co')
    await user.type(screen.getByLabelText('Contact Person'), 'John Smith')
    await user.type(screen.getByLabelText('Mobile'), '9876543210')
    await user.type(screen.getByLabelText('Email'), 'john@newco.com')
    await user.type(screen.getByLabelText('Address'), '99 New Street')

    await selectOption(user, 'Country', 'India')
    await selectOption(user, 'State', 'Maharashtra')
    await selectOption(user, 'City', 'Mumbai')

    await user.click(buttonByText('Save Supplier'))

    await waitFor(() => expect(useMastersStore.getState().suppliers).toHaveLength(1))
    const created = useMastersStore.getState().suppliers[0]
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
    renderPage(<SupplierForm />)
    await user.click(buttonByText('Save Supplier'))
    expect(useMastersStore.getState().suppliers).toHaveLength(0)
  })
})

describe('SupplierForm page — edit mode', () => {
  beforeEach(() => {
    resetMastersStore()
    vi.mocked(listCountries).mockReset()
    vi.mocked(listStates).mockReset()
    vi.mocked(listCities).mockReset()
    mockWorldApi()
  })

  function createSupplierWithLocation() {
    return useMastersStore.getState().createSupplier({
      ...baseInput,
      countryId: '102',
      countryName: 'India',
      stateId: '1660',
      stateName: 'Maharashtra',
      cityId: '46728',
      cityName: 'Mumbai',
    })
  }

  it('pre-fills the form and shows a disabled Supplier Code field', async () => {
    const supplier = useMastersStore.getState().createSupplier(baseInput)
    renderPage(<SupplierForm />, {
      path: '/masters/suppliers/:id/edit',
      initialEntries: [`/masters/suppliers/${supplier.id}/edit`],
    })

    expect(await screen.findByLabelText('Supplier Name')).toHaveValue('Acme Corp')
    expect(screen.getByLabelText('Supplier Code')).toBeDisabled()
    expect(screen.getByLabelText('Supplier Code')).toHaveValue('SUPP-0001')
  })

  it('updates the supplier in the store', async () => {
    const user = userEvent.setup()
    const supplier = createSupplierWithLocation()
    renderPage(<SupplierForm />, {
      path: '/masters/suppliers/:id/edit',
      initialEntries: [`/masters/suppliers/${supplier.id}/edit`],
    })

    const nameInput = await screen.findByLabelText('Supplier Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Acme Renamed')
    await user.click(buttonByText('Update Supplier'))

    await waitFor(() => expect(useMastersStore.getState().suppliers[0].name).toBe('Acme Renamed'))
  })
})

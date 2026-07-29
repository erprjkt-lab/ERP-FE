import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buttonByText, renderPage } from '@/test-utils/renderPage'
import type { VendorInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'

vi.mock('@/api/world', () => ({
  listCountries: vi.fn(),
  listStates: vi.fn(),
  listCities: vi.fn(),
}))

import { listCities, listCountries, listStates } from '@/api/world'
import { VendorForm } from './VendorForm'

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

describe('VendorForm page — create mode', () => {
  beforeEach(() => {
    resetMastersStore()
    vi.mocked(listCountries).mockReset()
    vi.mocked(listStates).mockReset()
    vi.mocked(listCities).mockReset()
    mockWorldApi()
  })

  it('renders section headings and the Save Vendor action', () => {
    renderPage(<VendorForm />)
    expect(screen.getByRole('heading', { name: 'Add Vendor' })).toBeInTheDocument()
    expect(screen.getByText('Basic Info')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Address', level: 5 })).toBeInTheDocument()
    expect(screen.getByText('Tax')).toBeInTheDocument()
    expect(screen.getByText('Banking')).toBeInTheDocument()
    expect(buttonByText('Save Vendor')).toBeInTheDocument()
  })

  it('does not show a Vendor Code field when creating', () => {
    renderPage(<VendorForm />)
    expect(screen.queryByLabelText('Vendor Code')).not.toBeInTheDocument()
  })

  it('creates a vendor with cascading country/state/city selection', async () => {
    const user = userEvent.setup()

    renderPage(<VendorForm />)

    await user.type(screen.getByLabelText('Vendor Name'), 'New Co')
    await user.type(screen.getByLabelText('Contact Person'), 'John Smith')
    await user.type(screen.getByLabelText('Mobile'), '9876543210')
    await user.type(screen.getByLabelText('Email'), 'john@newco.com')
    await user.type(screen.getByLabelText('Address'), '99 New Street')

    await selectOption(user, 'Country', 'India')
    await selectOption(user, 'State', 'Maharashtra')
    await selectOption(user, 'City', 'Mumbai')

    await user.click(buttonByText('Save Vendor'))

    await waitFor(() => expect(useMastersStore.getState().vendors).toHaveLength(1))
    const created = useMastersStore.getState().vendors[0]
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
    renderPage(<VendorForm />)
    await user.click(buttonByText('Save Vendor'))
    expect(useMastersStore.getState().vendors).toHaveLength(0)
  })
})

describe('VendorForm page — edit mode', () => {
  beforeEach(() => {
    resetMastersStore()
    vi.mocked(listCountries).mockReset()
    vi.mocked(listStates).mockReset()
    vi.mocked(listCities).mockReset()
    mockWorldApi()
  })

  function createVendorWithLocation() {
    return useMastersStore.getState().createVendor({
      ...baseInput,
      countryId: '102',
      countryName: 'India',
      stateId: '1660',
      stateName: 'Maharashtra',
      cityId: '46728',
      cityName: 'Mumbai',
    })
  }

  it('pre-fills the form and shows a disabled Vendor Code field', async () => {
    const vendor = useMastersStore.getState().createVendor(baseInput)
    renderPage(<VendorForm />, {
      path: '/masters/vendors/:id/edit',
      initialEntries: [`/masters/vendors/${vendor.id}/edit`],
    })

    expect(await screen.findByLabelText('Vendor Name')).toHaveValue('Acme Corp')
    expect(screen.getByLabelText('Vendor Code')).toBeDisabled()
    expect(screen.getByLabelText('Vendor Code')).toHaveValue('VEND-0001')
  })

  it('updates the vendor in the store', async () => {
    const user = userEvent.setup()
    const vendor = createVendorWithLocation()
    renderPage(<VendorForm />, {
      path: '/masters/vendors/:id/edit',
      initialEntries: [`/masters/vendors/${vendor.id}/edit`],
    })

    const nameInput = await screen.findByLabelText('Vendor Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Acme Renamed')
    await user.click(buttonByText('Update Vendor'))

    await waitFor(() => expect(useMastersStore.getState().vendors[0].name).toBe('Acme Renamed'))
  })
})

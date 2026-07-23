import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { buttonByText, renderPage } from '@/test-utils/renderPage'
import type { VendorInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
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

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, text: string) {
  await user.click(screen.getByLabelText(label))
  await user.click(await screen.findByText(text))
}

describe('VendorForm page — create mode', () => {
  beforeEach(() => {
    resetMastersStore()
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
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Maharashtra', countryId: country.id })
    useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })

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
      countryId: country.id,
      stateId: state.id,
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
  })

  // Country/State/City are required fields on this form, so any test that
  // submits needs a real vendor with valid location ids — otherwise
  // client-side validation silently blocks the submit and onFinish never runs.
  function createVendorWithLocation() {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Maharashtra', countryId: country.id })
    const city = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })
    return useMastersStore
      .getState()
      .createVendor({ ...baseInput, countryId: country.id, stateId: state.id, cityId: city.id })
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

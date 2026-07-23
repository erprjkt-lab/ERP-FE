import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { buttonByText, renderPage } from '@/test-utils/renderPage'
import type { SupplierInput } from '../store/mastersStore'
import { useMastersStore } from '../store/mastersStore'
import { resetMastersStore } from '../testUtils'
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

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, text: string) {
  await user.click(screen.getByLabelText(label))
  await user.click(await screen.findByText(text))
}

describe('SupplierForm page — create mode', () => {
  beforeEach(() => {
    resetMastersStore()
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
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Maharashtra', countryId: country.id })
    useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })

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
      countryId: country.id,
      stateId: state.id,
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
  })

  // Country/State/City are required fields on this form, so any test that
  // submits needs a real supplier with valid location ids — otherwise
  // client-side validation silently blocks the submit and onFinish never runs.
  function createSupplierWithLocation() {
    const country = useMastersStore.getState().createCountry({ name: 'India' })
    const state = useMastersStore
      .getState()
      .createState({ name: 'Maharashtra', countryId: country.id })
    const city = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })
    return useMastersStore
      .getState()
      .createSupplier({ ...baseInput, countryId: country.id, stateId: state.id, cityId: city.id })
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

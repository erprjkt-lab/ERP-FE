import { beforeEach, describe, expect, it } from 'vitest'
import { resetMastersStore } from '../testUtils'
import type { CustomerInput, SupplierInput, VendorInput } from './mastersStore'
import { useMastersStore } from './mastersStore'

const customerInput: CustomerInput = {
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

const supplierInput: SupplierInput = {
  name: 'Ganesh Suppliers',
  contactPerson: 'Ramesh',
  mobile: '9876543211',
  email: 'ramesh@ganesh.com',
  address: '456 Supplier Rd',
  countryId: null,
  stateId: null,
  cityId: null,
  pincode: '500001',
  paymentTerms: null,
  creditDays: 15,
  status: 'active',
}

const vendorInput: VendorInput = {
  name: 'Apex Vendor',
  vendorType: 'service',
  contactPerson: 'Vikram',
  mobile: '9876543212',
  email: 'vikram@apex.com',
  address: '789 Vendor Ln',
  countryId: null,
  stateId: null,
  cityId: null,
  pincode: '600001',
  status: 'active',
}

describe('useMastersStore', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  describe('countries', () => {
    it('createCountry adds a new country with a generated id and timestamps', () => {
      const country = useMastersStore.getState().createCountry({ name: 'India' })
      expect(country.id).toMatch(/^country-/)
      expect(country.name).toBe('India')
      expect(country.createdAt).toBeTruthy()
      expect(useMastersStore.getState().countries).toHaveLength(1)
    })

    it('updateCountry changes the name and updatedAt of the matching record only', () => {
      const a = useMastersStore.getState().createCountry({ name: 'India' })
      const b = useMastersStore.getState().createCountry({ name: 'USA' })
      useMastersStore.getState().updateCountry(a.id, { name: 'Bharat' })
      const countries = useMastersStore.getState().countries
      expect(countries.find(c => c.id === a.id)?.name).toBe('Bharat')
      expect(countries.find(c => c.id === b.id)?.name).toBe('USA')
    })

    it('deleteCountry removes only the matching record', () => {
      const a = useMastersStore.getState().createCountry({ name: 'India' })
      const b = useMastersStore.getState().createCountry({ name: 'USA' })
      useMastersStore.getState().deleteCountry(a.id)
      const countries = useMastersStore.getState().countries
      expect(countries).toHaveLength(1)
      expect(countries[0].id).toBe(b.id)
    })
  })

  describe('states', () => {
    it('createState links to a countryId', () => {
      const country = useMastersStore.getState().createCountry({ name: 'India' })
      const state = useMastersStore
        .getState()
        .createState({ name: 'Maharashtra', countryId: country.id })
      expect(state.countryId).toBe(country.id)
      expect(useMastersStore.getState().states).toHaveLength(1)
    })

    it('updateState can change the linked country', () => {
      const country1 = useMastersStore.getState().createCountry({ name: 'India' })
      const country2 = useMastersStore.getState().createCountry({ name: 'USA' })
      const state = useMastersStore
        .getState()
        .createState({ name: 'Maharashtra', countryId: country1.id })
      useMastersStore
        .getState()
        .updateState(state.id, { name: 'Maharashtra', countryId: country2.id })
      expect(useMastersStore.getState().states[0].countryId).toBe(country2.id)
    })

    it('deleteState removes the record', () => {
      const state = useMastersStore.getState().createState({ name: 'Maharashtra', countryId: null })
      useMastersStore.getState().deleteState(state.id)
      expect(useMastersStore.getState().states).toHaveLength(0)
    })
  })

  describe('cities', () => {
    it('createCity links to a stateId', () => {
      const state = useMastersStore.getState().createState({ name: 'Maharashtra', countryId: null })
      const city = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: state.id })
      expect(city.stateId).toBe(state.id)
    })

    it('deleteCity removes only the matching record', () => {
      const a = useMastersStore.getState().createCity({ name: 'Mumbai', stateId: null })
      const b = useMastersStore.getState().createCity({ name: 'Pune', stateId: null })
      useMastersStore.getState().deleteCity(a.id)
      const cities = useMastersStore.getState().cities
      expect(cities).toHaveLength(1)
      expect(cities[0].id).toBe(b.id)
    })
  })

  describe('customers', () => {
    it('createCustomer auto-generates a sequential CUST- code starting at 0001', () => {
      const customer = useMastersStore.getState().createCustomer(customerInput)
      expect(customer.code).toBe('CUST-0001')
      expect(customer.id).toMatch(/^customer-/)
      expect(customer.name).toBe('Acme Corp')
    })

    it('createCustomer increments the code sequence on subsequent creates', () => {
      useMastersStore.getState().createCustomer(customerInput)
      const second = useMastersStore
        .getState()
        .createCustomer({ ...customerInput, name: 'Beta Co' })
      expect(second.code).toBe('CUST-0002')
    })

    it('updateCustomer applies a partial patch and bumps updatedAt', () => {
      const customer = useMastersStore.getState().createCustomer(customerInput)
      const originalUpdatedAt = customer.updatedAt
      useMastersStore.getState().updateCustomer(customer.id, { name: 'Acme Corp Renamed' })
      const updated = useMastersStore.getState().customers[0]
      expect(updated.name).toBe('Acme Corp Renamed')
      expect(updated.code).toBe(customer.code)
      expect(updated.updatedAt).not.toBe(undefined)
      expect(originalUpdatedAt).toBeTruthy()
    })

    it('deleteCustomer removes the record', () => {
      const customer = useMastersStore.getState().createCustomer(customerInput)
      useMastersStore.getState().deleteCustomer(customer.id)
      expect(useMastersStore.getState().customers).toHaveLength(0)
    })
  })

  describe('suppliers', () => {
    it('createSupplier auto-generates a sequential SUPP- code', () => {
      const supplier = useMastersStore.getState().createSupplier(supplierInput)
      expect(supplier.code).toBe('SUPP-0001')
    })

    it('deleteSupplier removes the record', () => {
      const supplier = useMastersStore.getState().createSupplier(supplierInput)
      useMastersStore.getState().deleteSupplier(supplier.id)
      expect(useMastersStore.getState().suppliers).toHaveLength(0)
    })
  })

  describe('vendors', () => {
    it('createVendor auto-generates a sequential VEND- code', () => {
      const vendor = useMastersStore.getState().createVendor(vendorInput)
      expect(vendor.code).toBe('VEND-0001')
    })

    it('updateVendor applies a partial patch', () => {
      const vendor = useMastersStore.getState().createVendor(vendorInput)
      useMastersStore.getState().updateVendor(vendor.id, { status: 'inactive' })
      expect(useMastersStore.getState().vendors[0].status).toBe('inactive')
    })

    it('deleteVendor removes the record', () => {
      const vendor = useMastersStore.getState().createVendor(vendorInput)
      useMastersStore.getState().deleteVendor(vendor.id)
      expect(useMastersStore.getState().vendors).toHaveLength(0)
    })
  })

  describe('customer filters', () => {
    it('starts with empty/default filters', () => {
      expect(useMastersStore.getState().customerFilters).toEqual({
        search: '',
        status: null,
        customerType: null,
      })
    })

    it('setCustomerFilter updates a single key', () => {
      useMastersStore.getState().setCustomerFilter('search', 'acme')
      expect(useMastersStore.getState().customerFilters.search).toBe('acme')
      expect(useMastersStore.getState().customerFilters.status).toBeNull()
    })

    it('resetCustomerFilters restores defaults', () => {
      useMastersStore.getState().setCustomerFilter('search', 'acme')
      useMastersStore.getState().setCustomerFilter('status', 'active')
      useMastersStore.getState().setCustomerFilter('customerType', 'retail')
      useMastersStore.getState().resetCustomerFilters()
      expect(useMastersStore.getState().customerFilters).toEqual({
        search: '',
        status: null,
        customerType: null,
      })
    })
  })

  describe('supplier filters', () => {
    it('setSupplierFilter updates a single key', () => {
      useMastersStore.getState().setSupplierFilter('status', 'inactive')
      expect(useMastersStore.getState().supplierFilters).toEqual({ search: '', status: 'inactive' })
    })

    it('resetSupplierFilters restores defaults', () => {
      useMastersStore.getState().setSupplierFilter('status', 'inactive')
      useMastersStore.getState().resetSupplierFilters()
      expect(useMastersStore.getState().supplierFilters).toEqual({ search: '', status: null })
    })
  })

  describe('vendor filters', () => {
    it('setVendorFilter updates a single key', () => {
      useMastersStore.getState().setVendorFilter('vendorType', 'service')
      expect(useMastersStore.getState().vendorFilters.vendorType).toBe('service')
    })

    it('resetVendorFilters restores defaults', () => {
      useMastersStore.getState().setVendorFilter('vendorType', 'service')
      useMastersStore.getState().setVendorFilter('search', 'apex')
      useMastersStore.getState().resetVendorFilters()
      expect(useMastersStore.getState().vendorFilters).toEqual({
        search: '',
        status: null,
        vendorType: null,
      })
    })
  })
})

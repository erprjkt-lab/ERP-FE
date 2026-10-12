import { beforeEach, describe, expect, it } from 'vitest'
import { resetMastersStore } from '../testUtils'
import { useMastersStore } from './mastersStore'

describe('useMastersStore', () => {
  beforeEach(() => {
    resetMastersStore()
  })

  describe('customer filters', () => {
    it('starts with empty/default filters', () => {
      expect(useMastersStore.getState().customerFilters).toEqual({ search: '', status: null })
    })

    it('setCustomerFilter updates a single key', () => {
      useMastersStore.getState().setCustomerFilter('search', 'acme')
      expect(useMastersStore.getState().customerFilters.search).toBe('acme')
      expect(useMastersStore.getState().customerFilters.status).toBeNull()
    })

    it('resetCustomerFilters restores defaults', () => {
      useMastersStore.getState().setCustomerFilter('search', 'acme')
      useMastersStore.getState().setCustomerFilter('status', 'active')
      useMastersStore.getState().resetCustomerFilters()
      expect(useMastersStore.getState().customerFilters).toEqual({ search: '', status: null })
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
      useMastersStore.getState().setVendorFilter('status', 'inactive')
      expect(useMastersStore.getState().vendorFilters.status).toBe('inactive')
    })

    it('resetVendorFilters restores defaults', () => {
      useMastersStore.getState().setVendorFilter('status', 'inactive')
      useMastersStore.getState().setVendorFilter('search', 'apex')
      useMastersStore.getState().resetVendorFilters()
      expect(useMastersStore.getState().vendorFilters).toEqual({ search: '', status: null })
    })
  })
})

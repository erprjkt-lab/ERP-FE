import { useMastersStore } from './store/mastersStore'

export function resetMastersStore() {
  useMastersStore.setState({
    customerFilters: { search: '', status: null, customerType: null },
    supplierFilters: { search: '', status: null },
    vendorFilters: { search: '', status: null, vendorType: null },
  })
}

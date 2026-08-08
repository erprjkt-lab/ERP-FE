import type { SupplierQuotationInput } from '../store/procurementStore'
import { useProcurementStore } from '../store/procurementStore'
import { useCurrentUserName } from '../utils/currentUser'

export function useSupplierQuotations() {
  const data = useProcurementStore(s => s.supplierQuotations)
  return { data, isLoading: false }
}

export function useSupplierQuotation(id: string | undefined) {
  const data = useProcurementStore(s => s.supplierQuotations.find(q => q.id === id))
  return { data, isLoading: false }
}

export function useSupplierQuotationByPeSupplier(peSupplierId: string | undefined) {
  const data = useProcurementStore(s =>
    s.supplierQuotations.find(q => q.purchaseEnquirySupplierId === peSupplierId),
  )
  return { data, isLoading: false }
}

export function useQuotationsForEnquiry(purchaseEnquiryId: string | undefined) {
  const quotations = useProcurementStore(s => s.supplierQuotations)
  const data = quotations.filter(q => q.purchaseEnquiryId === purchaseEnquiryId)
  return { data, isLoading: false }
}

export function useRecordSupplierQuotation() {
  const record = useProcurementStore(s => s.recordSupplierQuotation)
  const createdBy = useCurrentUserName()
  return {
    mutateAsync: async (input: SupplierQuotationInput) => record(input, createdBy),
    isPending: false,
  }
}

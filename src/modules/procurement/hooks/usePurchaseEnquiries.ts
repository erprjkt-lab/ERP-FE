import type {
  CreateEnquiryFromRequisitionsInput,
  PurchaseEnquiryManualInput,
  PurchaseEnquirySupplierInput,
} from '../store/procurementStore'
import { useProcurementStore } from '../store/procurementStore'
import { useCurrentUserName } from '../utils/currentUser'

export function usePurchaseEnquiries() {
  const data = useProcurementStore(s => s.purchaseEnquiries)
  return { data, isLoading: false }
}

export function usePurchaseEnquiry(id: string | undefined) {
  const data = useProcurementStore(s => s.purchaseEnquiries.find(e => e.id === id))
  return { data, isLoading: false }
}

export function useCreatePurchaseEnquiryManual() {
  const create = useProcurementStore(s => s.createPurchaseEnquiryManual)
  const createdBy = useCurrentUserName()
  return {
    mutateAsync: async (input: PurchaseEnquiryManualInput) => create(input, createdBy),
    isPending: false,
  }
}

export function useCreatePurchaseEnquiryFromRequisitions() {
  const create = useProcurementStore(s => s.createPurchaseEnquiryFromRequisitions)
  const createdBy = useCurrentUserName()
  return {
    mutateAsync: async (input: CreateEnquiryFromRequisitionsInput) => create(input, createdBy),
    isPending: false,
  }
}

export function useAddSupplierToEnquiry() {
  const add = useProcurementStore(s => s.addSupplierToEnquiry)
  return {
    mutateAsync: async ({
      enquiryId,
      supplier,
    }: {
      enquiryId: string
      supplier: PurchaseEnquirySupplierInput
    }) => add(enquiryId, supplier),
    isPending: false,
  }
}

export function useRemoveSupplierFromEnquiry() {
  const remove = useProcurementStore(s => s.removeSupplierFromEnquiry)
  return {
    mutateAsync: async ({ enquiryId, peSupplierId }: { enquiryId: string; peSupplierId: string }) =>
      remove(enquiryId, peSupplierId),
    isPending: false,
  }
}

export function useSendPurchaseEnquiry() {
  const send = useProcurementStore(s => s.sendPurchaseEnquiry)
  return { mutateAsync: async (id: string) => send(id), isPending: false }
}

export function useDeletePurchaseEnquiry() {
  const del = useProcurementStore(s => s.deletePurchaseEnquiry)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

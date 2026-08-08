import type { PurchaseOrder } from '@/types/procurement'
import type { PurchaseOrderDirectInput } from '../store/procurementStore'
import { useProcurementStore } from '../store/procurementStore'
import { useCurrentUserName } from '../utils/currentUser'

export function usePurchaseOrders() {
  const data = useProcurementStore(s => s.purchaseOrders)
  return { data, isLoading: false }
}

export function usePurchaseOrder(id: string | undefined) {
  const data = useProcurementStore(s => s.purchaseOrders.find(po => po.id === id))
  return { data, isLoading: false }
}

export function useSelectSupplierForEnquiry() {
  const select = useProcurementStore(s => s.selectSupplierForEnquiry)
  return {
    mutateAsync: async ({ enquiryId, peSupplierId }: { enquiryId: string; peSupplierId: string }) =>
      select(enquiryId, peSupplierId),
    isPending: false,
  }
}

export function useCreatePurchaseOrderFromEnquiry() {
  const createFromEnquiry = useProcurementStore(s => s.createPurchaseOrderFromEnquiry)
  return {
    mutateAsync: async ({ enquiryId, force }: { enquiryId: string; force?: boolean }) =>
      createFromEnquiry(enquiryId, { force }),
    isPending: false,
  }
}

export function useCreatePurchaseOrderDirect() {
  const createDirect = useProcurementStore(s => s.createPurchaseOrderDirect)
  const createdBy = useCurrentUserName()
  return {
    mutateAsync: async (input: PurchaseOrderDirectInput) => createDirect(input, createdBy),
    isPending: false,
  }
}

export function useUpdatePurchaseOrderStatus() {
  const updateStatus = useProcurementStore(s => s.updatePurchaseOrderStatus)
  return {
    mutateAsync: async ({ id, status }: { id: string; status: PurchaseOrder['status'] }) =>
      updateStatus(id, status),
    isPending: false,
  }
}

export function useDeletePurchaseOrder() {
  const del = useProcurementStore(s => s.deletePurchaseOrder)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

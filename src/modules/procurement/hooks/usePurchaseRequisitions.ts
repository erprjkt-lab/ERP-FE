import type { PurchaseRequisitionInput } from '../store/procurementStore'
import { useProcurementStore } from '../store/procurementStore'
import { useCurrentUserName } from '../utils/currentUser'

export function usePurchaseRequisitions() {
  const data = useProcurementStore(s => s.purchaseRequisitions)
  return { data, isLoading: false }
}

export function usePurchaseRequisition(id: string | undefined) {
  const data = useProcurementStore(s => s.purchaseRequisitions.find(pr => pr.id === id))
  return { data, isLoading: false }
}

export function useCreatePurchaseRequisition() {
  const create = useProcurementStore(s => s.createPurchaseRequisition)
  const createdBy = useCurrentUserName()
  return {
    mutateAsync: async (input: PurchaseRequisitionInput) => create(input, createdBy),
    isPending: false,
  }
}

export function useUpdatePurchaseRequisition() {
  const update = useProcurementStore(s => s.updatePurchaseRequisition)
  return {
    mutateAsync: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<PurchaseRequisitionInput>
    }) => update(id, payload),
    isPending: false,
  }
}

export function useSubmitRequisitionForApproval() {
  const submit = useProcurementStore(s => s.submitRequisitionForApproval)
  return { mutateAsync: async (id: string) => submit(id), isPending: false }
}

export function useApproveRequisition() {
  const approve = useProcurementStore(s => s.approveRequisition)
  const approvedBy = useCurrentUserName()
  return { mutateAsync: async (id: string) => approve(id, approvedBy), isPending: false }
}

export function useRejectRequisition() {
  const reject = useProcurementStore(s => s.rejectRequisition)
  const approvedBy = useCurrentUserName()
  return {
    mutateAsync: async ({ id, reason }: { id: string; reason: string }) =>
      reject(id, approvedBy, reason),
    isPending: false,
  }
}

export function useDeletePurchaseRequisition() {
  const del = useProcurementStore(s => s.deletePurchaseRequisition)
  return { mutateAsync: async (id: string) => del(id), isPending: false }
}

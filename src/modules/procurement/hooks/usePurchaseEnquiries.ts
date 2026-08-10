import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPurchaseEnquiryFromRequisitions,
  createPurchaseEnquiryManual,
  getPurchaseEnquiry,
  getQuotationComparison,
  listPurchaseEnquiries,
  sendPurchaseEnquiry,
  updatePurchaseEnquiry,
} from '@/api/purchaseEnquiries'
import type {
  ApiPurchaseEnquiry,
  ApiPurchaseEnquiryItem,
  ApiPurchaseEnquirySupplier,
  ApiQuotationComparisonRow,
  PurchaseEnquiryFromRequisitionsPayload,
  PurchaseEnquiryItemPayload,
  PurchaseEnquiryManualPayload,
} from '@/types/api/procurement'
import type {
  PurchaseEnquiry,
  PurchaseEnquiryItem,
  PurchaseEnquirySupplier,
  PurchaseEnquirySupplierStatus,
  PurchaseEnquiryStatus,
  Priority,
} from '@/types/procurement'

export interface PurchaseEnquiryItemInput {
  purchaseRequisitionItemId?: string | null
  itemId: string
  itemCode?: string
  itemName?: string
  itemDescription?: string
  requiredQty: number
  uomId: string | null
  uomName?: string
  requiredDate?: string | null
  preferredDeliveryDate?: string | null
  remarks?: string
}

export interface PurchaseEnquirySupplierInput {
  supplierId: string
  supplierCode?: string
  supplierName?: string
}

export interface PurchaseEnquiryManualInput {
  enquiryDate: string
  enquiryDueDate?: string | null
  priority: Priority
  remarks?: string
  items: PurchaseEnquiryItemInput[]
  suppliers: PurchaseEnquirySupplierInput[]
}

export interface CreateEnquiryFromRequisitionsInput {
  requisitionIds: string[]
  enquiryDate: string
  enquiryDueDate?: string | null
  priority: Priority
  remarks?: string
  suppliers: PurchaseEnquirySupplierInput[]
}

function toItem(api: ApiPurchaseEnquiryItem): PurchaseEnquiryItem {
  return {
    id: String(api.id),
    purchaseRequisitionItemId: api.purchase_requisition_item_id
      ? String(api.purchase_requisition_item_id)
      : null,
    sourcePrNumber: api.source_pr_number,
    itemId: String(api.item_id),
    itemCode: api.item?.item_code,
    itemName: api.item?.item_name,
    itemDescription: api.item_description ?? undefined,
    requiredQty: Number(api.required_qty),
    uomId: api.uom_id ? String(api.uom_id) : null,
    uomName: api.uom?.name,
    requiredDate: api.required_date,
    preferredDeliveryDate: api.preferred_delivery_date,
    remarks: api.remarks ?? undefined,
  }
}

function toSupplier(api: ApiPurchaseEnquirySupplier): PurchaseEnquirySupplier {
  return {
    id: String(api.id),
    supplierId: String(api.supplier_id),
    supplierCode: api.supplier?.party_code,
    supplierName: api.supplier?.party_name,
    supplierStatus: api.supplier_status as PurchaseEnquirySupplierStatus,
    sentAt: api.sent_at,
    responseReceivedAt: api.response_received_at,
    remarks: api.remarks ?? undefined,
  }
}

function toPurchaseEnquiry(api: ApiPurchaseEnquiry): PurchaseEnquiry {
  return {
    id: String(api.id),
    enquiryNumber: api.enquiry_number,
    enquiryDate: api.enquiry_date,
    enquiryDueDate: api.enquiry_due_date,
    priority: api.priority as Priority,
    status: api.status as PurchaseEnquiryStatus,
    remarks: api.remarks ?? undefined,
    items: (api.items ?? []).map(toItem),
    suppliers: (api.suppliers ?? []).map(toSupplier),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function toItemPayload(item: PurchaseEnquiryItemInput): PurchaseEnquiryItemPayload {
  return {
    purchase_requisition_item_id: item.purchaseRequisitionItemId
      ? Number(item.purchaseRequisitionItemId)
      : null,
    item_id: Number(item.itemId),
    item_description: item.itemDescription ?? null,
    required_qty: item.requiredQty,
    uom_id: item.uomId ? Number(item.uomId) : 0,
    required_date: item.requiredDate ?? null,
    preferred_delivery_date: item.preferredDeliveryDate ?? null,
    remarks: item.remarks ?? null,
  }
}

export function usePurchaseEnquiries() {
  const query = useQuery({
    queryKey: ['purchase-enquiries'],
    queryFn: async () => (await listPurchaseEnquiries()).data,
  })
  return { data: (query.data ?? []).map(toPurchaseEnquiry), isLoading: query.isLoading }
}

export function usePurchaseEnquiry(id: string | undefined) {
  const query = useQuery({
    queryKey: ['purchase-enquiries', id],
    queryFn: async () => (await getPurchaseEnquiry(Number(id))).data,
    enabled: !!id,
  })
  return {
    data: query.data ? toPurchaseEnquiry(query.data) : undefined,
    isLoading: query.isLoading,
  }
}

export function useCreatePurchaseEnquiryManual() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PurchaseEnquiryManualInput) => {
      const payload: PurchaseEnquiryManualPayload = {
        enquiry_date: input.enquiryDate,
        enquiry_due_date: input.enquiryDueDate ?? null,
        priority: input.priority,
        remarks: input.remarks ?? null,
        supplier_ids: input.suppliers.map(s => Number(s.supplierId)),
        items: input.items.map(toItemPayload),
      }
      return toPurchaseEnquiry((await createPurchaseEnquiryManual(payload)).data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] }),
  })
}

export function useCreatePurchaseEnquiryFromRequisitions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateEnquiryFromRequisitionsInput) => {
      const payload: PurchaseEnquiryFromRequisitionsPayload = {
        purchase_requisition_ids: input.requisitionIds.map(Number),
        supplier_ids: input.suppliers.map(s => Number(s.supplierId)),
        enquiry_date: input.enquiryDate,
        enquiry_due_date: input.enquiryDueDate ?? null,
        priority: input.priority,
        remarks: input.remarks ?? null,
      }
      return toPurchaseEnquiry((await createPurchaseEnquiryFromRequisitions(payload)).data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requisitions'] })
    },
  })
}

// The backend only supports replacing the whole supplier_ids array (no
// dedicated add/remove-one-supplier endpoint) — fetch the current list and
// PUT the full set back, so the page-level call sites can stay one-liners.
export function useAddSupplierToEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      enquiryId,
      supplier,
    }: {
      enquiryId: string
      supplier: PurchaseEnquirySupplierInput
    }) => {
      const current = (await getPurchaseEnquiry(Number(enquiryId))).data
      const supplierIds = [
        ...(current.suppliers ?? []).map(s => s.supplier_id),
        Number(supplier.supplierId),
      ]
      return toPurchaseEnquiry(
        (await updatePurchaseEnquiry(Number(enquiryId), { supplier_ids: supplierIds })).data,
      )
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', variables.enquiryId] })
    },
  })
}

export function useRemoveSupplierFromEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      enquiryId,
      peSupplierId,
    }: {
      enquiryId: string
      peSupplierId: string
    }) => {
      const current = (await getPurchaseEnquiry(Number(enquiryId))).data
      const supplierIds = (current.suppliers ?? [])
        .filter(s => String(s.id) !== peSupplierId)
        .map(s => s.supplier_id)
      return toPurchaseEnquiry(
        (await updatePurchaseEnquiry(Number(enquiryId), { supplier_ids: supplierIds })).data,
      )
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', variables.enquiryId] })
    },
  })
}

export function useSendPurchaseEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      toPurchaseEnquiry((await sendPurchaseEnquiry(Number(id))).data),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', id] })
    },
  })
}

export interface QuotationComparisonQuote {
  supplierQuotationId: string
  supplierId: string
  supplierName: string | null
  supplierCode: string | null
  quotedQty: number
  uom: string | null
  rate: number
  discountPercent: number
  discountAmount: number
  taxPercent: number
  taxAmount: number
  freightAmount: number
  otherCharges: number
  lineTotal: number
  deliveryDate: string | null
  validUntil: string | null
  paymentTerms: string | null
  deliveryTerms: string | null
}

export interface QuotationComparisonRow {
  purchaseEnquiryItemId: string
  itemId: string | null
  itemName: string | null
  sourcePrNumber: string | null
  requiredQty: number | null
  quotes: QuotationComparisonQuote[]
}

function toComparisonRow(api: ApiQuotationComparisonRow): QuotationComparisonRow {
  return {
    purchaseEnquiryItemId: String(api.purchase_enquiry_item_id),
    itemId: api.item_id != null ? String(api.item_id) : null,
    itemName: api.item_name,
    sourcePrNumber: api.source_pr_number,
    requiredQty: api.required_qty,
    quotes: api.quotes.map(q => ({
      supplierQuotationId: String(q.supplier_quotation_id),
      supplierId: String(q.supplier_id),
      supplierName: q.supplier_name,
      supplierCode: q.supplier_code,
      quotedQty: Number(q.quoted_qty),
      uom: q.uom,
      rate: Number(q.rate),
      discountPercent: Number(q.discount_percent),
      discountAmount: Number(q.discount_amount),
      taxPercent: Number(q.tax_percent),
      taxAmount: Number(q.tax_amount),
      freightAmount: Number(q.freight_amount),
      otherCharges: Number(q.other_charges),
      lineTotal: Number(q.line_total),
      deliveryDate: q.delivery_date,
      validUntil: q.valid_until,
      paymentTerms: q.payment_terms,
      deliveryTerms: q.delivery_terms,
    })),
  }
}

export function useQuotationComparison(enquiryId: string | undefined) {
  const query = useQuery({
    queryKey: ['purchase-enquiries', enquiryId, 'quotation-comparison'],
    queryFn: async () => (await getQuotationComparison(Number(enquiryId))).data,
    enabled: !!enquiryId,
  })
  return { data: (query.data ?? []).map(toComparisonRow), isLoading: query.isLoading }
}

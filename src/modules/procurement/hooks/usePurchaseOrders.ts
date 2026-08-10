import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPurchaseOrderFromEnquiry, selectSupplierForEnquiry } from '@/api/purchaseEnquiries'
import { createPurchaseOrder, getPurchaseOrder, listPurchaseOrders } from '@/api/purchaseOrders'
import type {
  ApiPurchaseOrder,
  ApiPurchaseOrderItem,
  PurchaseOrderPayload,
} from '@/types/api/procurement'
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/types/procurement'

export interface PurchaseOrderItemInput {
  itemId: string
  itemName?: string
  orderedQty: number
  uomId: string | null
  uomName?: string
  rate: number
  discountPercent: number
  taxPercent: number
  deliveryDate?: string | null
  remarks?: string
}

export interface PurchaseOrderDirectInput {
  poDate: string
  supplierId: string
  supplierName?: string
  paymentTerms?: string
  deliveryTerms?: string
  freightAmount: number
  otherCharges: number
  remarks?: string
  items: PurchaseOrderItemInput[]
}

function toItem(api: ApiPurchaseOrderItem): PurchaseOrderItem {
  return {
    id: String(api.id),
    supplierQuotationItemId: api.supplier_quotation_item_id
      ? String(api.supplier_quotation_item_id)
      : null,
    purchaseEnquiryItemId: api.purchase_enquiry_item_id
      ? String(api.purchase_enquiry_item_id)
      : null,
    itemId: String(api.item_id),
    itemName: api.item?.item_name,
    orderedQty: Number(api.ordered_qty),
    uomId: api.uom_id ? String(api.uom_id) : null,
    uomName: api.uom?.name,
    rate: Number(api.rate),
    discountPercent: Number(api.discount_percent),
    discountAmount: Number(api.discount_amount),
    taxPercent: Number(api.tax_percent),
    taxAmount: Number(api.tax_amount),
    lineTotal: Number(api.line_total),
    deliveryDate: api.delivery_date,
    remarks: api.remarks ?? undefined,
  }
}

function toPurchaseOrder(api: ApiPurchaseOrder): PurchaseOrder {
  return {
    id: String(api.id),
    poNumber: api.po_number,
    poDate: api.po_date,
    supplierId: String(api.supplier_id),
    supplierName: api.supplier?.party_name,
    purchaseEnquiryId: api.purchase_enquiry_id ? String(api.purchase_enquiry_id) : null,
    purchaseEnquirySupplierId: api.purchase_enquiry_supplier_id
      ? String(api.purchase_enquiry_supplier_id)
      : null,
    paymentTerms: api.payment_terms ?? undefined,
    deliveryTerms: api.delivery_terms ?? undefined,
    freightAmount: Number(api.freight_amount),
    otherCharges: Number(api.other_charges),
    taxableAmount: Number(api.taxable_amount),
    taxAmount: Number(api.tax_amount),
    netAmount: Number(api.net_amount),
    status: api.status as PurchaseOrderStatus,
    remarks: api.remarks ?? undefined,
    items: (api.items ?? []).map(toItem),
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    approvedBy: api.approved_by != null ? String(api.approved_by) : null,
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

export function usePurchaseOrders() {
  const query = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => (await listPurchaseOrders()).data,
  })
  return { data: (query.data ?? []).map(toPurchaseOrder), isLoading: query.isLoading }
}

export function usePurchaseOrder(id: string | undefined) {
  const query = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => (await getPurchaseOrder(Number(id))).data,
    enabled: !!id,
  })
  return { data: query.data ? toPurchaseOrder(query.data) : undefined, isLoading: query.isLoading }
}

export function useSelectSupplierForEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      enquiryId,
      supplierId,
      quotationId,
      remarks,
    }: {
      enquiryId: string
      supplierId: string
      quotationId: string
      remarks?: string
    }) =>
      selectSupplierForEnquiry(Number(enquiryId), {
        supplier_id: Number(supplierId),
        quotation_id: Number(quotationId),
        remarks: remarks ?? null,
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', variables.enquiryId] })
    },
  })
}

export function useCreatePurchaseOrderFromEnquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ enquiryId, force }: { enquiryId: string; force?: boolean }) =>
      toPurchaseOrder((await createPurchaseOrderFromEnquiry(Number(enquiryId), force)).data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', variables.enquiryId] })
    },
  })
}

export function useCreatePurchaseOrderDirect() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PurchaseOrderDirectInput) => {
      const payload: PurchaseOrderPayload = {
        po_date: input.poDate,
        supplier_id: Number(input.supplierId),
        payment_terms: input.paymentTerms ?? null,
        delivery_terms: input.deliveryTerms ?? null,
        freight_amount: input.freightAmount,
        other_charges: input.otherCharges,
        remarks: input.remarks ?? null,
        items: input.items.map(item => ({
          item_id: Number(item.itemId),
          ordered_qty: item.orderedQty,
          uom_id: item.uomId ? Number(item.uomId) : 0,
          rate: item.rate,
          discount_percent: item.discountPercent,
          tax_percent: item.taxPercent,
          delivery_date: item.deliveryDate ?? null,
          remarks: item.remarks ?? null,
        })),
      }
      return toPurchaseOrder((await createPurchaseOrder(payload)).data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listQuotationsForEnquiry,
  recordSupplierQuotation,
  updateSupplierQuotation,
} from '@/api/supplierQuotations'
import type {
  ApiSupplierQuotation,
  ApiSupplierQuotationItem,
  SupplierQuotationItemPayload,
  SupplierQuotationPayload,
  SupplierQuotationUpdatePayload,
} from '@/types/api/procurement'
import type {
  SupplierQuotation,
  SupplierQuotationItem,
  SupplierQuotationStatus,
} from '@/types/procurement'

export interface SupplierQuotationItemInput {
  purchaseEnquiryItemId: string
  itemId: string
  itemName?: string
  quotedQty: number
  uomId: string | null
  uomName?: string
  rate: number
  discountPercent: number
  taxPercent: number
  deliveryDate?: string | null
  remarks?: string
}

export interface SupplierQuotationInput {
  purchaseEnquiryId: string
  purchaseEnquirySupplierId: string
  quotationNumber: string
  quotationDate: string
  validUntil?: string | null
  paymentTerms?: string
  deliveryTerms?: string
  freightAmount: number
  otherCharges: number
  remarks?: string
  items: SupplierQuotationItemInput[]
}

function toItem(api: ApiSupplierQuotationItem): SupplierQuotationItem {
  return {
    id: String(api.id),
    purchaseEnquiryItemId: api.purchase_enquiry_item_id ? String(api.purchase_enquiry_item_id) : '',
    itemId: String(api.item_id),
    itemName: api.item?.item_name,
    quotedQty: Number(api.quoted_qty),
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

/** Shared with usePurchaseEnquiries, which gets the same resource nested under
 *  each enquiry supplier. */
export function toSupplierQuotation(api: ApiSupplierQuotation): SupplierQuotation {
  return {
    id: String(api.id),
    purchaseEnquiryId: String(api.purchase_enquiry_id),
    purchaseEnquirySupplierId: String(api.purchase_enquiry_supplier_id ?? ''),
    quotationNumber: api.quotation_number,
    quotationDate: api.quotation_date,
    validUntil: api.valid_until,
    status: api.status as SupplierQuotationStatus,
    paymentTerms: api.payment_terms ?? undefined,
    deliveryTerms: api.delivery_terms ?? undefined,
    freightAmount: Number(api.freight_amount),
    otherCharges: Number(api.other_charges),
    totalAmount: Number(api.total_amount),
    items: (api.items ?? []).map(toItem),
    remarks: api.remarks ?? undefined,
    createdBy: api.created_by != null ? String(api.created_by) : '—',
    createdAt: '',
    updatedAt: '',
  }
}

function toItemPayload(item: SupplierQuotationItemInput): SupplierQuotationItemPayload {
  return {
    purchase_enquiry_item_id: Number(item.purchaseEnquiryItemId),
    item_id: Number(item.itemId),
    quoted_qty: item.quotedQty,
    uom_id: item.uomId ? Number(item.uomId) : 0,
    rate: item.rate,
    discount_percent: item.discountPercent,
    tax_percent: item.taxPercent,
    delivery_date: item.deliveryDate ?? null,
    remarks: item.remarks ?? null,
  }
}

export function useQuotationsForEnquiry(purchaseEnquiryId: string | undefined) {
  const query = useQuery({
    queryKey: ['purchase-enquiries', purchaseEnquiryId, 'quotations'],
    queryFn: async () => (await listQuotationsForEnquiry(Number(purchaseEnquiryId))).data,
    enabled: !!purchaseEnquiryId,
  })
  return { data: (query.data ?? []).map(toSupplierQuotation), isLoading: query.isLoading }
}

export function useSupplierQuotationByPeSupplier(
  purchaseEnquiryId: string | undefined,
  peSupplierId: string | undefined,
) {
  const { data: quotations, isLoading } = useQuotationsForEnquiry(purchaseEnquiryId)
  const data = quotations.find(q => q.purchaseEnquirySupplierId === peSupplierId)
  return { data, isLoading }
}

export function useRecordSupplierQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SupplierQuotationInput) => {
      const payload: SupplierQuotationPayload = {
        purchase_enquiry_supplier_id: Number(input.purchaseEnquirySupplierId),
        quotation_number: input.quotationNumber,
        quotation_date: input.quotationDate,
        valid_until: input.validUntil ?? null,
        payment_terms: input.paymentTerms ?? null,
        delivery_terms: input.deliveryTerms ?? null,
        freight_amount: input.freightAmount,
        other_charges: input.otherCharges,
        remarks: input.remarks ?? null,
        items: input.items.map(toItemPayload),
      }
      return toSupplierQuotation(
        (await recordSupplierQuotation(Number(input.purchaseEnquiryId), payload)).data,
      )
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['purchase-enquiries', variables.purchaseEnquiryId, 'quotations'],
      })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] })
      queryClient.invalidateQueries({
        queryKey: ['purchase-enquiries', variables.purchaseEnquiryId],
      })
    },
  })
}

/**
 * Edits a quotation already on file (PUT /quotations/{id}).
 *
 * `purchase_enquiry_supplier_id` is deliberately not sent: ERP-BE treats which
 * supplier a quotation belongs to as its identity and rejects a change with 422,
 * so re-pointing a quotation means deleting and re-recording it instead.
 */
export function useUpdateSupplierQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      quotationId,
      input,
    }: {
      quotationId: string
      input: SupplierQuotationInput
    }) => {
      const payload: SupplierQuotationUpdatePayload = {
        quotation_number: input.quotationNumber,
        quotation_date: input.quotationDate,
        valid_until: input.validUntil ?? null,
        payment_terms: input.paymentTerms ?? null,
        delivery_terms: input.deliveryTerms ?? null,
        freight_amount: input.freightAmount,
        other_charges: input.otherCharges,
        remarks: input.remarks ?? null,
        items: input.items.map(toItemPayload),
      }
      return toSupplierQuotation((await updateSupplierQuotation(Number(quotationId), payload)).data)
    },
    onSuccess: (_result, variables) => {
      const enquiryId = variables.input.purchaseEnquiryId
      queryClient.invalidateQueries({
        queryKey: ['purchase-enquiries', enquiryId, 'quotations'],
      })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-enquiries', enquiryId] })
    },
  })
}

/**
 * Pairs each enquiry line with the quotation line that was recorded against it,
 * for prefilling the edit form.
 *
 * Matching is by purchase_enquiry_item_id, which is what ERP-BE stores on every
 * quotation line. Lines recorded before that column was populated fall back to
 * item_id. Either way a quotation line is consumed once, so an enquiry listing
 * the same item on two rows prefills them from two different quotation lines
 * instead of both reading the first one.
 */
export function matchQuotationLines<E extends { id: string; itemId: string }>(
  enquiryItems: E[],
  quotationItems: SupplierQuotationItem[],
): (SupplierQuotationItem | undefined)[] {
  const remaining = [...quotationItems]

  const take = (predicate: (line: SupplierQuotationItem) => boolean) => {
    const index = remaining.findIndex(predicate)
    return index === -1 ? undefined : remaining.splice(index, 1)[0]
  }

  // Two passes: every exact enquiry-line match is claimed before any row is
  // allowed to fall back to item_id, so a fallback can't steal another row's line.
  const exact = enquiryItems.map(peItem =>
    take(line => line.purchaseEnquiryItemId !== '' && line.purchaseEnquiryItemId === peItem.id),
  )

  return exact.map(
    (line, index) => line ?? take(candidate => candidate.itemId === enquiryItems[index].itemId),
  )
}

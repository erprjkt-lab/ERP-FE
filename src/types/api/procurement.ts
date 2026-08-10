import type { ApiDepartment, ApiEmployee } from './hr'
import type { ApiItemMaster, ApiParty, ApiUom } from './masters'

// ---------- Purchase Requisition ----------

export interface ApiPurchaseRequisitionItem {
  id: number
  purchase_requisition_id: number
  item_id: number
  item?: ApiItemMaster
  item_description: string | null
  required_qty: number
  uom_id: number
  uom?: ApiUom
  required_date: string | null
  pending_qty: number
  remarks: string | null
}

export interface ApiPurchaseRequisition {
  id: number
  requisition_number: string
  requisition_date: string
  department_id: number | null
  department?: ApiDepartment
  priority: string
  status: string
  remarks: string | null
  approved_by: number | null
  approved_by_employee?: ApiEmployee
  approved_at: string | null
  items?: ApiPurchaseRequisitionItem[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface PurchaseRequisitionItemPayload {
  item_id: number
  item_description?: string | null
  required_qty: number
  uom_id: number
  required_date?: string | null
  remarks?: string | null
}

export interface PurchaseRequisitionPayload {
  requisition_date?: string
  department_id?: number | null
  priority?: string
  remarks?: string | null
  items?: PurchaseRequisitionItemPayload[]
}

export interface CreatePurchaseRequisitionPayload extends PurchaseRequisitionPayload {
  requisition_date: string
  items: PurchaseRequisitionItemPayload[]
}

export type UpdatePurchaseRequisitionPayload = PurchaseRequisitionPayload

// ---------- Purchase Enquiry ----------

export interface ApiPurchaseEnquiryItem {
  id: number
  purchase_enquiry_id: number
  purchase_requisition_item_id: number | null
  source_pr_number?: string | null
  item_id: number
  item?: ApiItemMaster
  item_description: string | null
  required_qty: number
  uom_id: number
  uom?: ApiUom
  required_date: string | null
  preferred_delivery_date: string | null
  remarks: string | null
}

export interface ApiPurchaseEnquirySupplier {
  id: number
  purchase_enquiry_id: number
  supplier_id: number
  supplier?: ApiParty
  supplier_status: string
  sent_at: string | null
  response_received_at: string | null
  remarks: string | null
  quotation?: ApiSupplierQuotation
  created_by: number | null
  updated_by: number | null
}

export interface ApiPurchaseEnquiry {
  id: number
  enquiry_number: string
  enquiry_date: string
  enquiry_due_date: string | null
  priority: string
  status: string
  remarks: string | null
  items?: ApiPurchaseEnquiryItem[]
  suppliers?: ApiPurchaseEnquirySupplier[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface PurchaseEnquiryItemPayload {
  purchase_requisition_item_id?: number | null
  item_id: number
  item_description?: string | null
  required_qty: number
  uom_id: number
  required_date?: string | null
  preferred_delivery_date?: string | null
  remarks?: string | null
}

export interface PurchaseEnquiryManualPayload {
  enquiry_date: string
  enquiry_due_date?: string | null
  priority?: string
  remarks?: string | null
  supplier_ids: number[]
  items: PurchaseEnquiryItemPayload[]
}

export interface PurchaseEnquiryFromRequisitionsPayload {
  purchase_requisition_ids: number[]
  supplier_ids: number[]
  enquiry_date?: string
  enquiry_due_date?: string | null
  priority?: string
  remarks?: string | null
}

export interface PurchaseEnquiryUpdatePayload {
  enquiry_date?: string
  enquiry_due_date?: string | null
  priority?: string
  remarks?: string | null
  supplier_ids?: number[]
  items?: PurchaseEnquiryItemPayload[]
}

export interface SelectSupplierPayload {
  supplier_id: number
  quotation_id: number
  remarks?: string | null
}

// ---------- Supplier Quotation ----------

export interface ApiSupplierQuotationItem {
  id: number
  supplier_quotation_id: number
  purchase_enquiry_item_id: number | null
  item_id: number
  item?: ApiItemMaster
  quoted_qty: number
  uom_id: number
  uom?: ApiUom
  rate: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  line_total: number
  delivery_date: string | null
  remarks: string | null
}

export interface ApiSupplierQuotation {
  id: number
  purchase_enquiry_id: number
  purchase_enquiry_supplier_id: number | null
  supplier?: ApiParty
  quotation_number: string
  quotation_date: string
  valid_until: string | null
  currency_id: number | null
  payment_terms: string | null
  delivery_terms: string | null
  freight_amount: number
  other_charges: number
  total_amount: number
  status: string
  remarks: string | null
  items?: ApiSupplierQuotationItem[]
  created_by: number | null
  updated_by: number | null
}

export interface SupplierQuotationItemPayload {
  purchase_enquiry_item_id?: number | null
  item_id: number
  quoted_qty: number
  uom_id: number
  rate: number
  discount_percent?: number
  tax_percent?: number
  delivery_date?: string | null
  remarks?: string | null
}

export interface SupplierQuotationPayload {
  purchase_enquiry_supplier_id: number
  quotation_number?: string | null
  quotation_date: string
  valid_until?: string | null
  payment_terms?: string | null
  delivery_terms?: string | null
  freight_amount?: number
  other_charges?: number
  remarks?: string | null
  items: SupplierQuotationItemPayload[]
}

// Custom shape returned by GET purchase-enquiries/{id}/quotation-comparison —
// pre-grouped by PE item, not a standard resource.
export interface ApiQuotationComparisonQuote {
  supplier_quotation_id: number
  supplier_id: number
  supplier_name: string | null
  supplier_code: string | null
  quoted_qty: number
  uom: string | null
  rate: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  freight_amount: number
  other_charges: number
  line_total: number
  delivery_date: string | null
  valid_until: string | null
  payment_terms: string | null
  delivery_terms: string | null
}

export interface ApiQuotationComparisonRow {
  purchase_enquiry_item_id: number
  item_id: number | null
  item_name: string | null
  source_pr_number: string | null
  required_qty: number | null
  quotes: ApiQuotationComparisonQuote[]
}

// ---------- Purchase Order ----------

export interface ApiPurchaseOrderItem {
  id: number
  purchase_order_id: number
  supplier_quotation_item_id: number | null
  purchase_enquiry_item_id: number | null
  item_id: number
  item?: ApiItemMaster
  ordered_qty: number
  uom_id: number
  uom?: ApiUom
  rate: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  line_total: number
  delivery_date: string | null
  remarks: string | null
}

export interface ApiPurchaseOrder {
  id: number
  po_number: string
  po_date: string
  supplier_id: number
  supplier?: ApiParty
  purchase_enquiry_id: number | null
  purchase_enquiry_supplier_id: number | null
  currency_id: number | null
  payment_terms: string | null
  delivery_terms: string | null
  freight_amount: number
  other_charges: number
  taxable_amount: number
  tax_amount: number
  net_amount: number
  status: string
  remarks: string | null
  items?: ApiPurchaseOrderItem[]
  created_by: number | null
  updated_by: number | null
  approved_by: number | null
  created_at: string | null
}

export interface PurchaseOrderItemPayload {
  item_id: number
  ordered_qty: number
  uom_id: number
  rate: number
  discount_percent?: number
  tax_percent?: number
  delivery_date?: string | null
  remarks?: string | null
}

export interface PurchaseOrderPayload {
  po_date: string
  supplier_id: number
  payment_terms?: string | null
  delivery_terms?: string | null
  freight_amount?: number
  other_charges?: number
  remarks?: string | null
  items: PurchaseOrderItemPayload[]
}

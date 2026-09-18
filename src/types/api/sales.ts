import type { ApiItemMaster, ApiUom } from './masters'

// ---------- Sales Enquiry ----------

export interface ApiSalesEnquiryItem {
  id: number
  sales_enquiry_id: number
  item_id: number
  item?: ApiItemMaster
  uom_id: number
  uom?: ApiUom
  qty: number
  annual_volume: number | null
  drawing_no: string | null
  process_route: string | null
  fg_weight: number | null
  gross_weight: number | null
  drawing_received: boolean
  feasible_status: string
  item_remark: string | null
  status: string
}

export interface ApiSalesEnquiry {
  id: number
  enquiry_number: string
  enquiry_date: string | null
  party_id: number
  party_name?: string | null
  ref_by: string | null
  ref_no: string | null
  status: string
  remarks: string | null
  items?: ApiSalesEnquiryItem[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface SalesEnquiryItemPayload {
  item_id: number
  uom_id: number
  qty: number
  annual_volume?: number | null
  drawing_no?: string | null
  process_route?: string | null
  fg_weight?: number | null
  gross_weight?: number | null
  drawing_received?: boolean
  feasible_status?: string | null
  item_remark?: string | null
}

export interface SalesEnquiryPayload {
  enquiry_date: string
  party_id: number
  ref_by?: string | null
  ref_no?: string | null
  remarks?: string | null
  items: SalesEnquiryItemPayload[]
}

// ---------- Sales Quotation ----------

export interface ApiSalesQuotationItem {
  id: number
  sales_quotation_id: number
  sales_enquiry_item_id: number | null
  item_id: number
  item?: ApiItemMaster
  uom_id: number
  uom?: ApiUom
  qty: number
  rate: number
  tool_cost: number | null
  gauge_cost: number | null
  sample_cost: number | null
  discount_percent: number | null
  discount_amount: number | null
  tax_percent: number | null
  tax_amount: number | null
  line_total: number
  delivery_time: string | null
  drawing_rev_no: string | null
  item_remark: string | null
}

export interface ApiSalesQuotation {
  id: number
  quotation_number: string
  sales_enquiry_id: number | null
  party_id: number
  party_name?: string | null
  party_state_code: string | null
  gstin: string | null
  gst_type: string | null
  quotation_date: string | null
  valid_until: string | null
  revision_no: number
  previous_quotation_id: number | null
  status: string
  remarks: string | null
  items?: ApiSalesQuotationItem[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface SalesQuotationItemPayload {
  sales_enquiry_item_id?: number | null
  item_id: number
  uom_id: number
  qty: number
  rate: number
  tool_cost?: number | null
  gauge_cost?: number | null
  sample_cost?: number | null
  discount_percent?: number | null
  tax_percent?: number | null
  delivery_time?: string | null
  drawing_rev_no?: string | null
  item_remark?: string | null
}

export interface SalesQuotationPayload {
  sales_enquiry_id?: number | null
  party_id?: number | null
  party_state_code?: string | null
  gstin?: string | null
  gst_type?: string | null
  quotation_date: string
  valid_until?: string | null
  remarks?: string | null
  items: SalesQuotationItemPayload[]
}

// ---------- Sales Order ----------

export interface ApiSalesOrderItem {
  id: number
  sales_order_id: number
  sales_quotation_item_id: number | null
  item_id: number
  item?: ApiItemMaster
  uom_id: number
  uom?: ApiUom
  qty: number
  rate: number
  quoted_rate: number | null
  discount_percent: number | null
  discount_amount: number | null
  tax_percent: number | null
  tax_amount: number | null
  line_total: number
  committed_date: string | null
  item_remark: string | null
}

export interface ApiSalesOrder {
  id: number
  order_number: string
  sales_quotation_id: number | null
  party_id: number
  party_name?: string | null
  party_state_code: string | null
  gstin: string | null
  gst_type: string | null
  order_date: string | null
  customer_po_no: string | null
  customer_po_date: string | null
  status: string
  approved_by: number | null
  remarks: string | null
  items?: ApiSalesOrderItem[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface SalesOrderItemPayload {
  item_id: number
  uom_id: number
  qty: number
  rate: number
  discount_percent?: number | null
  tax_percent?: number | null
  committed_date?: string | null
  item_remark?: string | null
}

export interface SalesOrderPayload {
  party_id: number
  party_state_code?: string | null
  gstin?: string | null
  gst_type?: string | null
  order_date: string
  customer_po_no?: string | null
  customer_po_date?: string | null
  remarks?: string | null
  items: SalesOrderItemPayload[]
}

export interface SalesOrderFromQuotationPayload {
  order_date?: string | null
  customer_po_no?: string | null
  customer_po_date?: string | null
  remarks?: string | null
}

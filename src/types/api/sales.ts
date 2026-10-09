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

// ---------- Delivery Challan ----------

export interface ApiDeliveryChallanItemStock {
  id: number
  delivery_challan_item_id: number
  location_id: number
  location_name?: string | null
  batch_no: string | null
  heat_no: string | null
  serial_no: string | null
  qty: number
  stock_movement_id: number | null
}

export interface ApiDeliveryChallanItem {
  id: number
  delivery_challan_id: number
  sales_order_item_id: number | null
  sales_order_id?: number | null
  item_id: number
  item?: ApiItemMaster
  uom_id: number
  uom?: ApiUom
  dispatch_qty: number
  rate: number
  order_rate: number | null
  discount_percent: number | null
  discount_amount: number | null
  tax_percent: number | null
  tax_amount: number | null
  line_total: number
  billed_qty: number
  item_remark: string | null
  stocks?: ApiDeliveryChallanItemStock[]
}

export interface ApiDeliveryChallan {
  id: number
  challan_number: string
  party_id: number
  party_name?: string | null
  party_state_code: string | null
  gstin: string | null
  gst_type: string | null
  challan_date: string | null
  vehicle_no: string | null
  lr_no: string | null
  lr_date: string | null
  transporter_name: string | null
  status: string
  remarks: string | null
  items?: ApiDeliveryChallanItem[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface DeliveryChallanItemStockPayload {
  location_id: number
  batch_no?: string | null
  heat_no?: string | null
  serial_no?: string | null
  qty: number
}

export interface DeliveryChallanItemPayload {
  sales_order_item_id?: number
  item_id?: number
  uom_id?: number
  rate?: number
  discount_percent?: number | null
  discount_amount?: number | null
  tax_percent?: number | null
  tax_amount?: number | null
  item_remark?: string | null
  stocks: DeliveryChallanItemStockPayload[]
}

export interface DeliveryChallanPayload {
  party_id: number
  party_state_code?: string | null
  gstin?: string | null
  gst_type?: string | null
  challan_date: string
  vehicle_no?: string | null
  lr_no?: string | null
  lr_date?: string | null
  transporter_name?: string | null
  remarks?: string | null
  items: DeliveryChallanItemPayload[]
}

// ---------- Item-wise (flat) listings — GET /sales-enquiry-items, /sales-order-items, /delivery-challan-items ----------
// One row per item line, joined with its header + item master + party by the BE
// (*ItemListResource). Numeric columns can arrive as decimal strings.

export interface ApiSalesEnquiryItemRow {
  id: number
  sales_enquiry_id: number
  enquiry_number: string
  enquiry_date: string
  enquiry_status: string
  party_id: number
  party_name: string | null
  item_id: number
  item_code: string | null
  item_name: string | null
  item_type: string | null
  uom_id: number | null
  uom_name: string | null
  uom_code: string | null
  qty: number | string
  annual_volume: number | string | null
  drawing_no: string | null
  process_route: string | null
  fg_weight: number | string | null
  gross_weight: number | string | null
  drawing_received: boolean | null
  feasible_status: string
  item_remark: string | null
  item_status: string
}

export interface ApiSalesOrderItemRow {
  id: number
  sales_order_id: number
  order_number: string
  order_date: string
  order_status: string
  party_id: number
  party_name: string | null
  sales_quotation_item_id: number | null
  item_id: number
  item_code: string | null
  item_name: string | null
  item_type: string | null
  uom_id: number | null
  uom_name: string | null
  uom_code: string | null
  qty: number | string
  rate: number | string
  quoted_rate: number | string | null
  discount_percent: number | string | null
  tax_percent: number | string | null
  line_total: number | string
  committed_date: string | null
  item_remark: string | null
}

export interface ApiDeliveryChallanItemRow {
  id: number
  delivery_challan_id: number
  challan_number: string
  challan_date: string
  challan_status: string
  party_id: number
  party_name: string | null
  sales_order_item_id: number | null
  item_id: number
  item_code: string | null
  item_name: string | null
  item_type: string | null
  uom_id: number | null
  uom_name: string | null
  uom_code: string | null
  dispatch_qty: number | string
  rate: number | string
  order_rate: number | string | null
  line_total: number | string
  billed_qty: number | string | null
  item_remark: string | null
}

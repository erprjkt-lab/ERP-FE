import type { BaseEntity, ID } from './index'

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type PurchaseRequisitionStatus =
  'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'CANCELLED'

export type PurchaseEnquiryStatus =
  | 'SENT'
  | 'PARTIALLY_RESPONDED'
  | 'RESPONDED'
  | 'COMPARISON_PENDING'
  | 'SUPPLIER_SELECTED'
  | 'PO_CREATED'
  | 'CLOSED'
  | 'CANCELLED'

export type PurchaseEnquirySupplierStatus =
  'PENDING' | 'SENT' | 'RESPONDED' | 'DECLINED' | 'NO_RESPONSE' | 'SELECTED' | 'NOT_SELECTED'

export type PurchaseOrderStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SENT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CLOSED'
  | 'CANCELLED'

export interface PurchaseRequisitionItem {
  id: ID
  itemId: ID
  itemCode?: string
  itemName?: string
  itemDescription?: string
  requiredQty: number
  uomId: ID | null
  uomName?: string
  requiredDate?: string | null
  pendingQty: number
  remarks?: string
}

export interface PurchaseRequisition extends BaseEntity {
  requisitionNumber: string
  requisitionDate: string
  departmentId?: ID | null
  departmentName?: string
  priority: Priority
  status: PurchaseRequisitionStatus
  remarks?: string
  items: PurchaseRequisitionItem[]
  createdBy: string
  approvedBy?: string | null
  approvedAt?: string | null
}

export interface PurchaseEnquiryItem {
  id: ID
  purchaseRequisitionItemId?: ID | null
  sourcePrNumber?: string | null
  itemId: ID
  itemCode?: string
  itemName?: string
  itemDescription?: string
  requiredQty: number
  uomId: ID | null
  uomName?: string
  requiredDate?: string | null
  preferredDeliveryDate?: string | null
  remarks?: string
}

export interface PurchaseEnquirySupplier {
  id: ID
  supplierId: ID
  supplierCode?: string
  supplierName?: string
  supplierStatus: PurchaseEnquirySupplierStatus
  sentAt?: string | null
  responseReceivedAt?: string | null
  remarks?: string
}

export interface PurchaseEnquiry extends BaseEntity {
  enquiryNumber: string
  enquiryDate: string
  enquiryDueDate?: string | null
  priority: Priority
  status: PurchaseEnquiryStatus
  remarks?: string
  items: PurchaseEnquiryItem[]
  suppliers: PurchaseEnquirySupplier[]
  createdBy: string
}

export interface SupplierQuotationItem {
  id: ID
  purchaseEnquiryItemId: ID
  itemId: ID
  itemName?: string
  quotedQty: number
  uomId: ID | null
  uomName?: string
  rate: number
  discountPercent: number
  discountAmount: number
  taxPercent: number
  taxAmount: number
  lineTotal: number
  deliveryDate?: string | null
  remarks?: string
}

export type SupplierQuotationStatus = 'RECEIVED' | 'SELECTED' | 'NOT_SELECTED'

export interface SupplierQuotation extends BaseEntity {
  purchaseEnquiryId: ID
  purchaseEnquirySupplierId: ID
  quotationNumber: string
  quotationDate: string
  validUntil?: string | null
  status: SupplierQuotationStatus
  paymentTerms?: string
  deliveryTerms?: string
  freightAmount: number
  otherCharges: number
  totalAmount: number
  items: SupplierQuotationItem[]
  remarks?: string
  createdBy: string
}

export interface PurchaseOrderItem {
  id: ID
  supplierQuotationItemId?: ID | null
  purchaseEnquiryItemId?: ID | null
  itemId: ID
  itemName?: string
  orderedQty: number
  uomId: ID | null
  uomName?: string
  rate: number
  discountPercent: number
  discountAmount: number
  taxPercent: number
  taxAmount: number
  lineTotal: number
  deliveryDate?: string | null
  remarks?: string
}

export interface PurchaseOrder extends BaseEntity {
  poNumber: string
  poDate: string
  supplierId: ID
  supplierName?: string
  purchaseEnquiryId?: ID | null
  purchaseEnquirySupplierId?: ID | null
  paymentTerms?: string
  deliveryTerms?: string
  freightAmount: number
  otherCharges: number
  taxableAmount: number
  taxAmount: number
  netAmount: number
  status: PurchaseOrderStatus
  remarks?: string
  items: PurchaseOrderItem[]
  createdBy: string
  approvedBy?: string | null
}

// Draft | Received | QC Pending | Completed | Cancelled
export type GrnStatus = 0 | 1 | 2 | 3 | 4
// Received(Blocked) | QC Pending | QC Done | Stock Posted | Cancelled
export type GrnLineStatus = 0 | 1 | 2 | 3 | 4

export interface GrnItem {
  id: ID
  grnId: ID
  poItemId: ID
  itemId: ID
  itemName?: string
  itemCode?: string
  // ItemMaster::TYPE_* — 2 = Raw Material. RM lines require an approved IIR
  // before QC can be saved (backend gate); other types are unaffected.
  itemType?: number
  orderedQty?: number
  gradeId?: ID | null
  gradeName?: string
  receivedQty: number
  commercialUnit?: string | null
  commercialQty?: number | null
  rate?: number | null
  batchNo?: string | null
  heatNo?: string | null
  heatVerified?: boolean | null
  serialNo?: string | null
  locationId: ID
  locationName?: string
  acceptedQty?: number | null
  rejectedQty?: number | null
  shortQty?: number | null
  lineStatus: GrnLineStatus
  remarks?: string
}

export interface Grn extends BaseEntity {
  grnNo: string
  supplierId: ID
  supplierName?: string
  supplierDocNo?: string | null
  supplierDocDate?: string | null
  grnDate: string
  status: GrnStatus
  remarks?: string
  items: GrnItem[]
  createdBy: string
}

// Flat item-wise rows for the list pages (GET /grn-items, /purchase-order-items,
// /purchase-enquiry-items). Header ids are kept so row actions can target the document.

export interface GrnItemRow {
  id: ID
  grnId: ID
  grnNo: string
  grnDate: string
  supplierId: ID
  supplierName?: string
  poNumber?: string
  itemId: ID
  itemCode?: string
  itemName?: string
  materialGrade?: string
  receivedQty: number
  commercialUnit?: string
  batchNo?: string
  heatNo?: string
  locationName?: string
  acceptedQty: number | null
  rejectedQty: number | null
  lineStatus: GrnLineStatus
}

export interface PurchaseOrderItemRow {
  id: ID
  purchaseOrderId: ID
  poNumber: string
  poDate: string
  status: PurchaseOrderStatus
  supplierId: ID
  supplierName?: string
  fromEnquiry: boolean
  itemId: ID
  itemCode?: string
  itemName?: string
  orderedQty: number
  receivedQty: number
  pendingQty: number
  uomName?: string
  rate: number
  lineTotal: number
  deliveryDate?: string
}

export interface PurchaseEnquiryItemRow {
  id: ID
  purchaseEnquiryId: ID
  enquiryNumber: string
  enquiryDate: string
  enquiryDueDate?: string
  priority: Priority
  status: PurchaseEnquiryStatus
  itemId: ID
  itemCode?: string
  itemName?: string
  requiredQty: number
  uomName?: string
  requiredDate?: string
}

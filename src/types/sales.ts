import type { BaseEntity, ID } from './index'

export type SalesEnquiryStatus = 'OPEN' | 'QUOTED' | 'CLOSED'

export type SalesEnquiryItemStatus = 'OPEN' | 'QUOTED' | 'CLOSED'

export type FeasibleStatus = 'PENDING' | 'FEASIBLE' | 'NOT_FEASIBLE'

export type SalesQuotationStatus =
  'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'REVISED'

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED'

export interface SalesEnquiryItem {
  id: ID
  itemId: ID
  itemCode?: string
  itemName?: string
  uomId: ID | null
  uomName?: string
  qty: number
  annualVolume?: number | null
  drawingNo?: string | null
  processRoute?: string | null
  fgWeight?: number | null
  grossWeight?: number | null
  drawingReceived: boolean
  feasibleStatus: FeasibleStatus
  itemRemark?: string | null
  status: SalesEnquiryItemStatus
}

export interface SalesEnquiry extends BaseEntity {
  enquiryNumber: string
  enquiryDate: string
  partyId: ID
  partyName?: string
  refBy?: string | null
  refNo?: string | null
  status: SalesEnquiryStatus
  remarks?: string | null
  items: SalesEnquiryItem[]
  createdBy: string
}

export interface SalesQuotationItem {
  id: ID
  salesEnquiryItemId?: ID | null
  itemId: ID
  itemCode?: string
  itemName?: string
  uomId: ID | null
  uomName?: string
  qty: number
  rate: number
  toolCost: number
  gaugeCost: number
  sampleCost: number
  discountPercent: number
  discountAmount: number
  taxPercent: number
  taxAmount: number
  lineTotal: number
  deliveryTime?: string | null
  drawingRevNo?: string | null
  itemRemark?: string | null
}

export interface SalesQuotation extends BaseEntity {
  quotationNumber: string
  salesEnquiryId?: ID | null
  partyId: ID
  partyName?: string
  partyStateCode?: string | null
  gstin?: string | null
  gstType?: string | null
  quotationDate: string
  validUntil?: string | null
  revisionNo: number
  previousQuotationId?: ID | null
  status: SalesQuotationStatus
  remarks?: string | null
  items: SalesQuotationItem[]
  /** Summed from line totals — the API exposes no header-level total. */
  netAmount: number
  createdBy: string
}

export interface SalesOrderItem {
  id: ID
  salesQuotationItemId?: ID | null
  itemId: ID
  itemCode?: string
  itemName?: string
  uomId: ID | null
  uomName?: string
  qty: number
  rate: number
  quotedRate?: number | null
  discountPercent: number
  discountAmount: number
  taxPercent: number
  taxAmount: number
  lineTotal: number
  committedDate?: string | null
  itemRemark?: string | null
}

export interface SalesOrder extends BaseEntity {
  orderNumber: string
  salesQuotationId?: ID | null
  partyId: ID
  partyName?: string
  partyStateCode?: string | null
  gstin?: string | null
  gstType?: string | null
  orderDate: string
  customerPoNo?: string | null
  customerPoDate?: string | null
  status: SalesOrderStatus
  approvedBy?: string | null
  remarks?: string | null
  items: SalesOrderItem[]
  /** Summed from line totals — the API exposes no header-level total. */
  netAmount: number
  createdBy: string
}

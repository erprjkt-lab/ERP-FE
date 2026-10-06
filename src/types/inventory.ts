import type { BaseEntity, ID } from './index'

export type StockRequisitionPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type StockRequisitionStatus =
  'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'CANCELLED'

export interface StockRequisitionItem {
  id: ID
  itemId: ID
  itemCode?: string
  itemName?: string
  requiredQty: number
  uomId: ID
  uomName?: string
  pendingQty: number
  remarks?: string
}

export interface StockRequisition extends BaseEntity {
  requisitionNumber: string
  requisitionDate: string
  departmentId: ID | null
  departmentName?: string
  requestedById: ID | null
  requestedByName?: string
  priority: StockRequisitionPriority
  status: StockRequisitionStatus
  remarks?: string
  items: StockRequisitionItem[]
  createdBy: string
  approvedBy?: string | null
  approvedAt?: string | null
}

export type StockAdjustmentReason = 'PHYSICAL_COUNT' | 'DAMAGE' | 'EXPIRY' | 'OTHER'

export type StockAdjustmentStatus = 'DRAFT' | 'APPROVED' | 'CANCELLED'

export interface StockAdjustmentItem {
  id: ID
  itemId: ID
  itemCode?: string
  itemName?: string
  batchNo?: string
  heatNo?: string
  systemQty: number
  physicalQty: number
  varianceQty: number
  remarks?: string
}

export interface StockAdjustment extends BaseEntity {
  adjustmentNumber: string
  adjustmentDate: string
  locationId: ID
  locationName?: string
  reason: StockAdjustmentReason
  status: StockAdjustmentStatus
  remarks?: string
  items: StockAdjustmentItem[]
  createdBy: string
  approvedBy?: string | null
  approvedAt?: string | null
}

export type StockIssueSource = 'REQUISITION' | 'DIRECT'

export interface StockIssue {
  id: ID
  source: StockIssueSource
  stockRequisitionItemId?: ID
  itemId?: ID
  itemName?: string
  storeLocationId: ID
  storeLocationName?: string
  batchNo?: string
  heatNo?: string
  issuedQty: number
  issueDate?: string
  issuedByName?: string
  issuedToId?: ID
  issuedToName?: string
  createdAt?: string
}

export interface StockLedgerEntry {
  id: ID
  itemId: ID
  itemName?: string
  locationId: ID
  locationName?: string
  batchNo?: string
  heatNo?: string
  serialNo?: string
  transactionType: number
  transactionTypeLabel?: string
  transactionDate?: string
  quantity: number
  inOut: number
  rate?: number | null
}

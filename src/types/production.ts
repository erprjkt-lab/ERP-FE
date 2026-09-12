import type { BaseEntity, Status } from './index'

export interface Process extends BaseEntity {
  processName: string
  processCode?: string
  cycleTime?: number
  status: Status
}

export interface ItemProcessRouteStep {
  id: string
  processId: string
  processName: string
  sequenceNo: number
  cycleTimeSeconds?: number
  isOptional: boolean
}

export type JobCardStatus = 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'closed'
export type ManufacturingRoute = 'standard' | 'rework' | 'sample'

export interface JobCardRouteStep {
  id: string
  processId: string
  processName: string
  sequenceNo: number
}

export interface JobCardBomRequirement {
  id: string
  componentItemId: string
  componentName: string
  requiredQty: number
  issuedQty: number
  returnedQty: number
}

export interface MaterialIssue {
  id: string
  componentItemId?: string
  componentName: string
  storeLocationId: string
  storeLocationName: string
  batchNo?: string
  heatNo?: string
  issuedQty: number
  issueDate: string
}

export interface JobCardAcceptance {
  id: string
  movementId: string
  acceptedQty: number
  shortQty: number
  acceptedAt: string
}

export interface JobCardMovement {
  id: string
  fromProcessId: string
  fromProcessName: string
  toProcessId: string
  toProcessName: string
  movedQty: number
  movedAt: string
  acceptances: JobCardAcceptance[]
}

export type PerformedByType = 'in_house' | 'outsourced'

export interface ProcessLog {
  id: string
  processId: string
  processName: string
  performedByType: PerformedByType
  processorName: string
  operatorName: string
  shiftName: string
  logDate: string
  okQty: number
  rejectedQty: number
  bypassedQty: number
  remark?: string
}

export interface JobCard {
  id: string
  jobCardNumber: string
  jobCardDate: string
  targetDate: string
  partyId?: string
  partyName?: string
  itemId: string
  itemName: string
  itemRevision?: string
  orderedQty: number
  manufacturingRoute: ManufacturingRoute
  outputLocationId: string
  outputLocationName?: string
  currentProcessId?: string
  currentProcessName?: string
  status: JobCardStatus
  remark?: string
  routes: JobCardRouteStep[]
}

export interface ItemBomLine {
  id: string
  componentItemId: string
  componentName: string
  quantityPerUnit: number
  uomId: string
  uomName: string
  scrapAllowancePercent?: number
  status: Status
}

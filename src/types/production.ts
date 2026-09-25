import type { BaseEntity, Status } from './index'

export interface Process extends BaseEntity {
  processName: string
  processCode?: string
  cycleTime?: number
  inspectionRequired: boolean
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
  inboundChallanItemId?: string
  remark?: string
}

export type ChallanRequestStatus = 'pending' | 'fulfilled'

export interface ChallanRequest {
  id: string
  jobCardId: string
  processId: string
  processName: string
  requestedQty: number
  dispatchedQty: number
  consumedQty: number
  pendingQty: number
  status: ChallanRequestStatus
  requestedByName?: string
  requestedAt?: string
}

export type ChallanStatus = 'open' | 'received' | 'closed'

export interface ChallanItem {
  id: string
  challanId: string
  challanRequestId: string
  jobCardId: string
  processId: string
  processName: string
  dispatchedQty: number
  receivedQty: number
  outstandingQty: number
  rate?: number
  amount?: number
}

export interface Challan {
  id: string
  challanNumber: string
  challanDate: string
  destinationPartyId: string
  destinationPartyName: string
  status: ChallanStatus
  items: ChallanItem[]
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

export type InspectionParamType = 'product' | 'process'

export interface InspectionParameter {
  id: string
  processId: string
  processName: string
  paramType: InspectionParamType
  parameter: string
  specification: string
  min?: number
  max?: number
  machineTool?: string
  instrument?: string
  charClass?: string
  size?: string
  frequency?: number
  freqUnit?: 'Hrs' | 'Lot'
  reactionPlan?: string
  controlMethod?: string
  status: Status
}

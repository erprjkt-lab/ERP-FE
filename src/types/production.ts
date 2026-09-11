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

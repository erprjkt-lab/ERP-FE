import { describe, expect, it } from 'vitest'
import type { JobCardRouteStep, ProcessLog, RejectionReview } from '@/types/production'
import { computeReworkBatch } from './reworkProgress'

const routes: JobCardRouteStep[] = [
  { id: '1', processId: '10', processName: 'Cutting', sequenceNo: 1 },
  { id: '2', processId: '20', processName: 'Machining', sequenceNo: 2 },
  { id: '3', processId: '30', processName: 'Inspection', sequenceNo: 3 },
]

const review = {
  id: 'rev-1',
  rejectionId: 'rej-1',
  reviewedQty: 3,
  decision: 'REWORK',
  reasonId: 'r1',
  reworkProcessId: '20',
  status: 'APPROVED',
} as RejectionReview

function log(processId: string, ok: number, rejected = 0, reviewId?: string): ProcessLog {
  return {
    id: `log-${processId}-${ok}-${rejected}-${reviewId ?? 'plain'}`,
    processId,
    processName: '',
    performedByType: 'in_house',
    processorName: '',
    operatorName: '',
    shiftName: '',
    logDate: '2026-10-07',
    okQty: ok,
    rejectedQty: rejected,
    bypassedQty: 0,
    inboundReworkReviewId: reviewId,
    isRework: Boolean(reviewId),
  }
}

describe('computeReworkBatch', () => {
  it('starts at the rework step and runs to the end of the route', () => {
    const batch = computeReworkBatch(routes, review, [])

    expect(batch.steps.map(s => s.step.processName)).toEqual(['Machining', 'Inspection'])
    expect(batch.steps[0].availableQty).toBe(3)
    expect(batch.outstandingQty).toBe(3)
  })

  it('ignores logs that do not cite this review', () => {
    const batch = computeReworkBatch(routes, review, [log('20', 3), log('20', 1, 0, 'rev-2')])

    expect(batch.steps[0].loggedQty).toBe(0)
    expect(batch.outstandingQty).toBe(3)
  })

  it('carries only OK qty to the next step', () => {
    const batch = computeReworkBatch(routes, review, [log('20', 2, 1, 'rev-1')])

    expect(batch.steps[0]).toMatchObject({ okQty: 2, rejectedQty: 1, pendingQty: 0 })
    // 2 OK out of Machining is all Inspection gets to work on.
    expect(batch.steps[1]).toMatchObject({ availableQty: 2, pendingQty: 2 })
    expect(batch.outstandingQty).toBe(0)
  })

  it('marks the first step with work left as current', () => {
    const batch = computeReworkBatch(routes, review, [log('20', 3, 0, 'rev-1')])

    expect(batch.steps[0].isCurrent).toBe(false)
    expect(batch.steps[1].isCurrent).toBe(true)
  })

  it('counts To Move from its own OK qty, not from job-card movements', () => {
    const batch = computeReworkBatch(routes, review, [log('20', 3, 0, 'rev-1')])

    // 3 OK at Machining, nothing logged at Inspection yet.
    expect(batch.steps[0].readyToMoveQty).toBe(3)
    // Last step of the redo has nowhere to move to.
    expect(batch.steps[1].readyToMoveQty).toBe(0)
  })

  it('drops To Move as the next step picks the qty up', () => {
    const batch = computeReworkBatch(routes, review, [
      log('20', 3, 0, 'rev-1'),
      log('30', 2, 0, 'rev-1'),
    ])

    expect(batch.steps[0].readyToMoveQty).toBe(1)
  })

  it('reports the qty that made it through the whole route', () => {
    const batch = computeReworkBatch(routes, review, [
      log('20', 3, 0, 'rev-1'),
      log('30', 3, 0, 'rev-1'),
    ])

    expect(batch.finishedQty).toBe(3)
    expect(batch.steps.every(step => step.pendingQty === 0)).toBe(true)
  })
})

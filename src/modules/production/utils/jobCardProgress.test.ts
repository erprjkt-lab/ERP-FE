import { describe, expect, it } from 'vitest'
import type { JobCardMovement, JobCardRouteStep, ProcessLog } from '@/types/production'
import { computeJobCardTotals, computeStepProgress } from './jobCardProgress'

const routes: JobCardRouteStep[] = [
  { id: '1', processId: '10', processName: 'Cutting', sequenceNo: 1 },
  { id: '2', processId: '20', processName: 'Machining', sequenceNo: 2 },
  { id: '3', processId: '30', processName: 'Inspection', sequenceNo: 3 },
]

function log(processId: string, ok: number, rejected: number, bypassed = 0): ProcessLog {
  return {
    id: `log-${processId}-${ok}-${rejected}-${bypassed}`,
    processId,
    processName: '',
    performedByType: 'in_house',
    processorName: '',
    operatorName: '',
    shiftName: '',
    logDate: '2026-09-12',
    okQty: ok,
    rejectedQty: rejected,
    bypassedQty: bypassed,
    isRework: false,
  }
}

function movement(
  fromProcessId: string,
  toProcessId: string,
  movedQty: number,
  accepted: { acceptedQty: number; shortQty?: number }[] = [],
  reworkReviewId: string | null = null,
): JobCardMovement {
  return {
    id: `mv-${fromProcessId}-${toProcessId}-${movedQty}`,
    fromProcessId,
    fromProcessName: '',
    toProcessId,
    toProcessName: '',
    reworkReviewId,
    isRework: reworkReviewId !== null,
    movedQty,
    movedAt: '2026-09-12',
    acceptances: accepted.map((entry, index) => ({
      id: `acc-${index}`,
      movementId: `mv-${fromProcessId}-${toProcessId}-${movedQty}`,
      acceptedQty: entry.acceptedQty,
      shortQty: entry.shortQty ?? 0,
      acceptedAt: '2026-09-12',
    })),
  }
}

describe('computeStepProgress', () => {
  it('gives the first step the ordered qty and later steps nothing until material arrives', () => {
    const [cutting, machining] = computeStepProgress(routes, [], [], 20)

    expect(cutting.availableQty).toBe(20)
    expect(cutting.pendingQty).toBe(20)
    expect(cutting.isCurrent).toBe(true)
    expect(machining.availableQty).toBe(0)
    expect(machining.pendingQty).toBe(0)
  })

  it('only lets produced-OK qty be moved onward, never rejected qty', () => {
    const [cutting] = computeStepProgress(routes, [log('10', 10, 10)], [], 20)

    expect(cutting.loggedQty).toBe(20)
    expect(cutting.pendingQty).toBe(0)
    // The 10 rejected are scrapped; only the 10 ok can travel on.
    expect(cutting.readyToMoveQty).toBe(10)
  })

  it('shows moved-but-not-yet-accepted qty as unaccepted at the receiving step', () => {
    const progress = computeStepProgress(
      routes,
      [log('10', 10, 10)],
      [movement('10', '20', 10)],
      20,
    )

    expect(progress[0].readyToMoveQty).toBe(0)
    expect(progress[1].unacceptedQty).toBe(10)
    // Not accepted yet, so nothing can be produced at machining.
    expect(progress[1].availableQty).toBe(0)
    expect(progress[1].isCurrent).toBe(true)
  })

  it('clears the receiving step to produce once the movement is accepted', () => {
    const progress = computeStepProgress(
      routes,
      [log('10', 10, 10)],
      [movement('10', '20', 10, [{ acceptedQty: 10 }])],
      20,
    )

    expect(progress[1].unacceptedQty).toBe(0)
    expect(progress[1].acceptedQty).toBe(10)
    expect(progress[1].availableQty).toBe(10)
    expect(progress[1].pendingQty).toBe(10)
  })

  it('treats short qty as settled so it stops showing as awaiting acceptance', () => {
    const progress = computeStepProgress(
      routes,
      [log('10', 10, 0)],
      [movement('10', '20', 10, [{ acceptedQty: 8, shortQty: 2 }])],
      20,
    )

    expect(progress[1].unacceptedQty).toBe(0)
    expect(progress[1].availableQty).toBe(8)
  })

  it('accumulates multiple logs against the same step', () => {
    const [cutting] = computeStepProgress(routes, [log('10', 6, 2), log('10', 4, 8)], [], 20)

    expect(cutting.okQty).toBe(10)
    expect(cutting.rejectedQty).toBe(10)
    expect(cutting.loggedQty).toBe(20)
  })

  it('keeps a partially produced step as the current one', () => {
    const [cutting, machining] = computeStepProgress(routes, [log('10', 5, 0)], [], 20)

    expect(cutting.pendingQty).toBe(15)
    expect(cutting.isCurrent).toBe(true)
    expect(machining.isCurrent).toBe(false)
  })

  it('flags first and last steps for the accept/stock gates', () => {
    const progress = computeStepProgress(routes, [], [], 20)

    expect(progress[0].isFirst).toBe(true)
    expect(progress[0].isLast).toBe(false)
    expect(progress[2].isLast).toBe(true)
  })

  // ERP-BE used to post finished-goods stock the moment the last step was logged,
  // so that step could never be "ready to move". Receiving is now its own action,
  // and the qty waits here until it happens — exactly like a movement elsewhere.
  it('leaves the last step ready to move until its qty is received into store', () => {
    const progress = computeStepProgress(
      routes,
      [log('10', 20, 0), log('20', 20, 0), log('30', 20, 0)],
      [
        movement('10', '20', 20, [{ acceptedQty: 20 }]),
        movement('20', '30', 20, [{ acceptedQty: 20 }]),
      ],
      20,
    )

    const inspection = progress[2]
    expect(inspection.isLast).toBe(true)
    expect(inspection.okQty).toBe(20)
    expect(inspection.readyToMoveQty).toBe(20)
  })

  it('nets a partial receipt out of the last step', () => {
    const progress = computeStepProgress(
      routes,
      [log('10', 20, 0), log('20', 20, 0), log('30', 20, 0)],
      [
        movement('10', '20', 20, [{ acceptedQty: 20 }]),
        movement('20', '30', 20, [{ acceptedQty: 20 }]),
      ],
      20,
      15,
    )

    expect(progress[2].readyToMoveQty).toBe(5)
  })

  it('shows nothing left to move once everything is received', () => {
    const progress = computeStepProgress(
      routes,
      [log('10', 20, 0), log('20', 20, 0), log('30', 20, 0)],
      [
        movement('10', '20', 20, [{ acceptedQty: 20 }]),
        movement('20', '30', 20, [{ acceptedQty: 20 }]),
      ],
      20,
      20,
    )

    expect(progress[2].readyToMoveQty).toBe(0)
  })

  it('keeps a rework movement out of the first pass numbers', () => {
    // ERP-BE auto-creates a tagged movement back to the rework step when a Rework
    // review is approved. It belongs to the redo, not to the first pass, so none of
    // its qty may surface in the regular row — the leak this split exists to stop.
    const firstPassOnly = computeStepProgress(
      routes,
      [log('10', 20, 0)],
      [movement('10', '20', 20, [{ acceptedQty: 20 }])],
      20,
    )
    const withRework = computeStepProgress(
      routes,
      [log('10', 20, 0)],
      [
        movement('10', '20', 20, [{ acceptedQty: 20 }]),
        // Machining sent 5 back to Cutting for a redo.
        movement('20', '10', 5, [], 'review-1'),
      ],
      20,
    )

    expect(withRework).toEqual(firstPassOnly)
    expect(withRework[0].unacceptedQty).toBe(0)
    expect(withRework[0].availableQty).toBe(20)
  })

  it('marks no step as current once every step is fully produced', () => {
    const progress = computeStepProgress(
      routes,
      [log('10', 20, 0), log('20', 20, 0), log('30', 20, 0)],
      [
        movement('10', '20', 20, [{ acceptedQty: 20 }]),
        movement('20', '30', 20, [{ acceptedQty: 20 }]),
      ],
      20,
    )

    expect(progress.every(row => !row.isCurrent)).toBe(true)
  })
})

describe('computeJobCardTotals', () => {
  it('counts OK qty at the final route step only', () => {
    const totals = computeJobCardTotals(routes, [log('10', 10, 0), log('30', 8, 2)], 10)

    expect(totals.completedQty).toBe(8)
    expect(totals.rejectedQty).toBe(2)
  })

  it('counts qty recovered by a rework redo as completed', () => {
    // The 2 rejected at Inspection come back through a redo and pass: the job
    // card has produced all 10, so the summary must not stay stuck at 8.
    const redo: ProcessLog = { ...log('30', 2, 0), id: 'redo', isRework: true }
    const totals = computeJobCardTotals(routes, [log('30', 8, 2), redo], 10)

    expect(totals.completedQty).toBe(10)
    expect(totals.balanceQty).toBe(0)
    expect(totals.completionPercent).toBe(100)
  })

  it('closes out the balance once rejected qty is scrapped for good', () => {
    // 8 good, 2 written off by an approved Reject review. Nothing is left to
    // produce, so Balance must read 0 rather than sticking at 2 forever.
    const totals = computeJobCardTotals(routes, [log('30', 8, 2)], 10, 2)

    expect(totals.completedQty).toBe(8)
    expect(totals.balanceQty).toBe(0)
    expect(totals.completionPercent).toBe(100)
  })

  it('keeps qty still under rework in the balance', () => {
    // Same 8 + 2, but the 2 went back for rework instead of being scrapped —
    // they are still in play, so the order is not finished.
    const totals = computeJobCardTotals(routes, [log('30', 8, 2)], 10, 0)

    expect(totals.balanceQty).toBe(2)
    expect(totals.completionPercent).toBe(80)
  })

  it('returns zeroes for a job card with no route', () => {
    const totals = computeJobCardTotals([], [log('30', 5, 0)], 10)

    expect(totals.completedQty).toBe(0)
    expect(totals.rejectedQty).toBe(0)
  })
})

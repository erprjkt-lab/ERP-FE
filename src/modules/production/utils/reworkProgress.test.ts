import { describe, expect, it } from 'vitest'
import type {
  JobCardMovement,
  JobCardRouteStep,
  ProcessLog,
  RejectionReview,
} from '@/types/production'
import { computeReworkSummary } from './reworkProgress'

const routes: JobCardRouteStep[] = [
  { id: '1', processId: '10', processName: 'Cutting', sequenceNo: 1 },
  { id: '2', processId: '20', processName: 'Machining', sequenceNo: 2 },
  { id: '3', processId: '30', processName: 'Inspection', sequenceNo: 3 },
]

function review(id: string, reviewedQty: number, reworkProcessId: string, reason?: string) {
  return {
    id,
    rejectionId: `rej-${id}`,
    reviewedQty,
    decision: 'REWORK',
    reasonId: 'r1',
    reasonName: reason,
    reworkProcessId,
    status: 'APPROVED',
  } as RejectionReview
}

function log(
  processId: string,
  ok: number,
  rejected = 0,
  reviewId: string | undefined = 'rev-1',
): ProcessLog {
  return {
    id: `log-${processId}-${ok}-${rejected}-${reviewId}`,
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
    isRework: true,
  }
}

// A forward hop inside the redo: moved on and accepted at the next step.
function movedAndAccepted(
  fromProcessId: string,
  toProcessId: string,
  movedQty: number,
  acceptedQty = movedQty,
): JobCardMovement {
  return {
    id: `mv-${fromProcessId}-${toProcessId}-${movedQty}`,
    fromProcessId,
    fromProcessName: '',
    toProcessId,
    toProcessName: '',
    reworkReviewId: null,
    isRework: true,
    movedQty,
    movedAt: '2026-10-07',
    acceptances: [
      {
        id: `acc-${fromProcessId}-${toProcessId}`,
        movementId: `mv-${fromProcessId}-${toProcessId}-${movedQty}`,
        acceptedQty,
        shortQty: 0,
        acceptedAt: '2026-10-07',
      },
    ],
  }
}

// A receive: a rework-bucket movement out of a process with no next process.
function movedToStore(fromProcessId: string, movedQty: number): JobCardMovement {
  return {
    id: `mv-${fromProcessId}-store-${movedQty}`,
    fromProcessId,
    fromProcessName: '',
    toProcessId: '',
    toProcessName: '',
    reworkReviewId: null,
    isRework: true,
    movedQty,
    movedAt: '2026-10-07',
    acceptances: [],
  }
}

describe('computeReworkSummary', () => {
  it('pools every review into one pass starting at the earliest rework step', () => {
    // Newest first, as the reviews hook returns them.
    const reviews = [review('rev-2', 20, '20'), review('rev-1', 5, '10')]
    const summary = computeReworkSummary(routes, reviews, [])

    expect(summary.steps.map(s => s.step.processName)).toEqual([
      'Cutting',
      'Machining',
      'Inspection',
    ])
    expect(summary.totalQty).toBe(25)
    // Each review's qty waits at the process it was sent back to.
    expect(summary.steps[0].availableQty).toBe(5)
    expect(summary.steps[1].availableQty).toBe(20)
  })

  it('adds two reviews aimed at the same process together', () => {
    const reviews = [review('rev-2', 4, '20'), review('rev-1', 6, '20')]
    const summary = computeReworkSummary(routes, reviews, [])

    expect(summary.steps).toHaveLength(2)
    expect(summary.steps[0].availableQty).toBe(10)
    expect(summary.steps[0].pendingQty).toBe(10)
    expect(summary.outstandingQty).toBe(10)
  })

  it('does not hand qty to the next step until it is moved and accepted', () => {
    const reviews = [review('rev-1', 1, '20')]
    const logs = [log('20', 1)]

    // Logged OK at Machining, but never moved on: Inspection has nothing.
    const beforeMove = computeReworkSummary(routes, reviews, logs)
    expect(beforeMove.steps[0]).toMatchObject({ okQty: 1, readyToMoveQty: 1 })
    expect(beforeMove.steps[1]).toMatchObject({ availableQty: 0, pendingQty: 0 })

    const afterMove = computeReworkSummary(routes, reviews, logs, [movedAndAccepted('20', '30', 1)])
    expect(afterMove.steps[0].readyToMoveQty).toBe(0)
    expect(afterMove.steps[1]).toMatchObject({ availableQty: 1, pendingQty: 1 })
  })

  it('pools what several reviews logged at one process', () => {
    const reviews = [review('rev-2', 4, '20'), review('rev-1', 6, '20')]
    const summary = computeReworkSummary(routes, reviews, [
      log('20', 6, 0, 'rev-1'),
      log('20', 3, 1, 'rev-2'),
    ])

    // 10 arrived, 10 logged (9 ok + 1 rejected), nothing left to redo here.
    expect(summary.steps[0]).toMatchObject({ okQty: 9, rejectedQty: 1, pendingQty: 0 })
    expect(summary.outstandingQty).toBe(0)
  })

  it('makes the final step receivable and drops it once received', () => {
    const reviews = [review('rev-1', 3, '20')]
    const logs = [log('20', 3), log('30', 3)]

    const before = computeReworkSummary(routes, reviews, logs, [movedAndAccepted('20', '30', 3)])
    expect(before.finishedQty).toBe(3)
    expect(before.steps[1].readyToMoveQty).toBe(3)

    const after = computeReworkSummary(routes, reviews, logs, [
      movedAndAccepted('20', '30', 3),
      movedToStore('30', 3),
    ])
    expect(after.steps[1].readyToMoveQty).toBe(0)
  })

  it('lists each review under its process, oldest first, and dedupes reasons', () => {
    const reviews = [
      review('rev-2', 4, '20', 'Cutting not done'),
      review('rev-1', 6, '20', 'Cutting not done'),
    ]
    const summary = computeReworkSummary(routes, reviews, [])

    expect(summary.reviewsByProcess.get('20')?.map(r => r.id)).toEqual(['rev-1', 'rev-2'])
    expect(summary.reasons).toEqual(['Cutting not done'])
  })

  it('counts a redo logged without a review id — ERP-BE no longer requires one', () => {
    const reviews = [review('rev-1', 5, '20')]
    // The first pass table drops anything flagged rework, so if this one were
    // keyed off the review id it would vanish from both tables.
    const summary = computeReworkSummary(routes, reviews, [log('20', 5, 0, undefined)])

    expect(summary.steps[0]).toMatchObject({ okQty: 5, pendingQty: 0, readyToMoveQty: 5 })
  })

  it('returns nothing to show when no review points at a route step', () => {
    expect(computeReworkSummary(routes, [], []).steps).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import type { JobCardMovement, JobCardRouteStep, ProcessLog } from '@/types/production'
import { computeStepProgress } from './jobCardProgress'

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
  }
}

function movement(
  fromProcessId: string,
  toProcessId: string,
  movedQty: number,
  accepted: { acceptedQty: number; shortQty?: number }[] = [],
): JobCardMovement {
  return {
    id: `mv-${fromProcessId}-${toProcessId}-${movedQty}`,
    fromProcessId,
    fromProcessName: '',
    toProcessId,
    toProcessName: '',
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
})

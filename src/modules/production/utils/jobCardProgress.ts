import type { JobCardMovement, JobCardRouteStep, ProcessLog } from '@/types/production'

export interface StepProgress {
  step: JobCardRouteStep
  /** Qty moved in from the previous process but not yet accepted here. */
  unacceptedQty: number
  /** Qty accepted into this process — what it is cleared to work on. */
  acceptedQty: number
  okQty: number
  rejectedQty: number
  bypassedQty: number
  /** ok + rejected + bypassed logged at this step. */
  loggedQty: number
  /** Units this step is cleared to work on (step 1 draws on the ordered qty). */
  availableQty: number
  /** Still to be produced here. */
  pendingQty: number
  /** Produced OK here and not yet moved on to the next process. */
  readyToMoveQty: number
  isFirst: boolean
  isLast: boolean
  isCurrent: boolean
}

/** Builds the per-process picture the shop floor works from.
 *
 * Two quantity gates exist per process: material has to be *accepted* into it
 * (movement from the previous process, then an acceptance), and then it gets
 * *produced* (a process log). The first process skips the accept gate — it
 * draws on the job card's ordered qty once material has been issued.
 *
 * Only OK qty travels onward: rejected units are scrapped, and moving forward
 * is capped at what this step produced but has not already sent on. */
export function computeStepProgress(
  routes: JobCardRouteStep[],
  logs: ProcessLog[],
  movements: JobCardMovement[],
  orderedQty: number,
): StepProgress[] {
  const sorted = [...routes].sort((a, b) => a.sequenceNo - b.sequenceNo)

  const logTotals = logs.reduce<Record<string, { ok: number; rejected: number; bypassed: number }>>(
    (acc, log) => {
      const entry = acc[log.processId] ?? { ok: 0, rejected: 0, bypassed: 0 }
      entry.ok += log.okQty
      entry.rejected += log.rejectedQty
      entry.bypassed += log.bypassedQty
      acc[log.processId] = entry
      return acc
    },
    {},
  )

  const movedIn: Record<string, number> = {}
  const movedOut: Record<string, number> = {}
  const settled: Record<string, number> = {}

  for (const movement of movements) {
    movedIn[movement.toProcessId] = (movedIn[movement.toProcessId] ?? 0) + movement.movedQty
    movedOut[movement.fromProcessId] = (movedOut[movement.fromProcessId] ?? 0) + movement.movedQty

    for (const acceptance of movement.acceptances) {
      settled[movement.toProcessId] =
        (settled[movement.toProcessId] ?? 0) + acceptance.acceptedQty + acceptance.shortQty
    }
  }

  const acceptedOnly = movements.reduce<Record<string, number>>((acc, movement) => {
    for (const acceptance of movement.acceptances) {
      acc[movement.toProcessId] = (acc[movement.toProcessId] ?? 0) + acceptance.acceptedQty
    }
    return acc
  }, {})

  const rows = sorted.map<StepProgress>((step, index) => {
    const totals = logTotals[step.processId] ?? { ok: 0, rejected: 0, bypassed: 0 }
    const loggedQty = totals.ok + totals.rejected + totals.bypassed
    const isFirst = index === 0
    const acceptedQty = acceptedOnly[step.processId] ?? 0
    const availableQty = isFirst ? orderedQty : acceptedQty

    return {
      step,
      unacceptedQty: Math.max((movedIn[step.processId] ?? 0) - (settled[step.processId] ?? 0), 0),
      acceptedQty,
      okQty: totals.ok,
      rejectedQty: totals.rejected,
      bypassedQty: totals.bypassed,
      loggedQty,
      availableQty,
      pendingQty: Math.max(availableQty - loggedQty, 0),
      readyToMoveQty: Math.max(totals.ok - (movedOut[step.processId] ?? 0), 0),
      isFirst,
      isLast: index === sorted.length - 1,
      isCurrent: false,
    }
  })

  // Whichever step has something to do next: material waiting to be accepted,
  // or quantity still to be produced.
  const actionableIndex = rows.findIndex(row => row.unacceptedQty > 0 || row.pendingQty > 0)
  const activeIndex = actionableIndex === -1 ? rows.length - 1 : actionableIndex
  if (rows[activeIndex]) rows[activeIndex].isCurrent = true

  return rows
}

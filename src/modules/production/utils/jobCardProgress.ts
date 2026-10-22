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
 * is capped at what this step produced but has not already sent on.
 *
 * Rework is a separate run: ERP-BE tags the movement it auto-creates when a
 * Rework review is approved (`is_rework`), and keeps a `regular`/`rework` split
 * of its own in GET /job-cards/{id}/process-summary. Rework movements are
 * dropped here so a redo never leaks into the first pass's numbers — see
 * computeReworkBatch() for the other half. */
export function computeStepProgress(
  routes: JobCardRouteStep[],
  logs: ProcessLog[],
  movements: JobCardMovement[],
  orderedQty: number,
  /** Qty already pulled into store as a production receipt. Only the last step
   *  settles this way, so it nets out there rather than against a movement. */
  receivedQty = 0,
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

  const regularMovements = movements.filter(movement => !movement.isRework)

  const movedIn: Record<string, number> = {}
  const movedOut: Record<string, number> = {}
  const settled: Record<string, number> = {}

  for (const movement of regularMovements) {
    movedIn[movement.toProcessId] = (movedIn[movement.toProcessId] ?? 0) + movement.movedQty
    movedOut[movement.fromProcessId] = (movedOut[movement.fromProcessId] ?? 0) + movement.movedQty

    for (const acceptance of movement.acceptances) {
      settled[movement.toProcessId] =
        (settled[movement.toProcessId] ?? 0) + acceptance.acceptedQty + acceptance.shortQty
    }
  }

  const acceptedOnly = regularMovements.reduce<Record<string, number>>((acc, movement) => {
    for (const acceptance of movement.acceptances) {
      acc[movement.toProcessId] = (acc[movement.toProcessId] ?? 0) + acceptance.acceptedQty
    }
    return acc
  }, {})

  const rows = sorted.map<StepProgress>((step, index) => {
    const totals = logTotals[step.processId] ?? { ok: 0, rejected: 0, bypassed: 0 }
    const loggedQty = totals.ok + totals.rejected + totals.bypassed
    const isFirst = index === 0
    const isLast = index === sorted.length - 1
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
      // The last step has no next process, so its OK qty settles by being
      // received into store rather than by a movement. ERP-BE stopped posting
      // that stock automatically on logging, so the qty waits here as
      // ready-to-move until someone receives it, exactly like any other step.
      readyToMoveQty: isLast
        ? Math.max(totals.ok - receivedQty, 0)
        : Math.max(totals.ok - (movedOut[step.processId] ?? 0), 0),
      isFirst,
      isLast,
      isCurrent: false,
    }
  })

  // Whichever step has something to do next: material waiting to be accepted,
  // or quantity still to be produced. If nothing qualifies, the job card has
  // nothing left to do anywhere — leave every row non-current rather than
  // defaulting to the last step, which would otherwise look like it's still
  // "in progress" there even once fully produced.
  const actionableIndex = rows.findIndex(row => row.unacceptedQty > 0 || row.pendingQty > 0)
  if (rows[actionableIndex]) rows[actionableIndex].isCurrent = true

  return rows
}

export interface JobCardTotals {
  /** OK qty at the final route step — what actually reached finished goods. */
  completedQty: number
  /** Rejected qty anywhere on the route, whatever became of it afterwards. */
  rejectedQty: number
  /** Still to be produced: neither finished nor written off. */
  balanceQty: number
  /** Share of the order that is settled — finished or scrapped. */
  completionPercent: number
}

/** Job-card-level totals for the summary strip.
 *
 * Unlike computeStepProgress, which keeps the first pass and each rework redo
 * apart so neither double-counts the other, this counts *every* log: a unit
 * recovered by a redo is finished goods just the same, and leaving it out left
 * "Completed" short and "Balance" permanently above zero after any rework.
 *
 * `scrappedQty` is the qty written off for good — the reviewed_qty of approved
 * Reject reviews. It is deliberately not "everything ever rejected": a unit sent
 * back for rework is still in play, and counting it as settled would show the
 * order finished while the redo was still on the floor. Scrapped units can never
 * be produced, so they close out the balance rather than leaving it stuck. */
export function computeJobCardTotals(
  routes: JobCardRouteStep[],
  logs: ProcessLog[],
  orderedQty = 0,
  scrappedQty = 0,
): JobCardTotals {
  const sorted = [...routes].sort((a, b) => a.sequenceNo - b.sequenceNo)
  const lastProcessId = sorted[sorted.length - 1]?.processId

  const completedQty = logs
    .filter(log => log.processId === lastProcessId)
    .reduce((sum, log) => sum + log.okQty, 0)
  const settledQty = completedQty + scrappedQty

  return {
    completedQty,
    rejectedQty: logs.reduce((sum, log) => sum + log.rejectedQty, 0),
    balanceQty: Math.max(orderedQty - settledQty, 0),
    completionPercent:
      orderedQty > 0 ? Math.min(Math.round((settledQty / orderedQty) * 100), 100) : 0,
  }
}

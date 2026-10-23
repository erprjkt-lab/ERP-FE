import type {
  JobCardMovement,
  JobCardRouteStep,
  ProcessLog,
  RejectionReview,
} from '@/types/production'
import type { StepProgress } from './jobCardProgress'

export interface ReworkBatch {
  review: RejectionReview
  /** Route steps from the rework point onward, with this batch's own quantities. */
  steps: StepProgress[]
  /** reviewed qty still to be re-logged at the rework step. */
  outstandingQty: number
  /** OK qty this batch has reached the end of the route with. */
  finishedQty: number
}

/**
 * The rework batch's own pass through the route, built only from logs citing its
 * review. ERP-BE balance-checks the review's reviewed_qty at the rework step only;
 * every later step is ordinary forward flow it re-classifies as rework, so here the
 * batch simply carries its OK qty from one step to the next.
 *
 * Approving the review makes ERP-BE auto-create a movement into the rework step
 * tagged with the review id. That movement still has to be accepted like any
 * other, so it is what the redo step's Unaccepted/In columns are drawn from —
 * logging itself is not gated on it (the backend balances against reviewed_qty),
 * which is why a missing acceptance shows up as Unaccepted rather than blocking.
 */
export function computeReworkBatch(
  routes: JobCardRouteStep[],
  review: RejectionReview,
  logs: ProcessLog[],
  movements: JobCardMovement[] = [],
): ReworkBatch {
  const sorted = [...routes].sort((a, b) => a.sequenceNo - b.sequenceNo)
  const startIndex = sorted.findIndex(step => step.processId === review.reworkProcessId)
  const batchLogs = logs.filter(log => log.inboundReworkReviewId === review.id)
  const batchMovements = movements.filter(movement => movement.reworkReviewId === review.id)

  const movedInAt = (processId: string) =>
    batchMovements
      .filter(movement => movement.toProcessId === processId)
      .reduce((sum, movement) => sum + movement.movedQty, 0)

  const settledAt = (processId: string) =>
    batchMovements
      .filter(movement => movement.toProcessId === processId)
      .reduce(
        (sum, movement) =>
          sum + movement.acceptances.reduce((a, acc) => a + acc.acceptedQty + acc.shortQty, 0),
        0,
      )

  const slice = sorted.slice(Math.max(startIndex, 0))

  // What the redo may still send onward out of the route's final step, i.e.
  // receive into store. ERP-BE validates this against one rework bucket per
  // process rather than per review, so it is counted the same way here: every
  // rework log's OK qty at that process, less every rework movement out of it.
  // ponytail: with two open rework batches both tables show the same shared
  // figure; split it per review once ERP-BE tags receive movements with one.
  const reworkPoolOut = (processId: string) =>
    Math.max(
      logs
        .filter(log => log.inboundReworkReviewId != null && log.processId === processId)
        .reduce((sum, log) => sum + log.okQty, 0) -
        movements
          .filter(movement => movement.isRework && movement.fromProcessId === processId)
          .reduce((sum, movement) => sum + movement.movedQty, 0),
      0,
    )
  const loggedAt = (processId: string) =>
    batchLogs
      .filter(log => log.processId === processId)
      .reduce((sum, log) => sum + log.okQty + log.rejectedQty + log.bypassedQty, 0)

  const steps: StepProgress[] = []
  let availableQty = review.reviewedQty

  slice.forEach((step, index) => {
    const stepLogs = batchLogs.filter(log => log.processId === step.processId)
    const okQty = stepLogs.reduce((sum, log) => sum + log.okQty, 0)
    const rejectedQty = stepLogs.reduce((sum, log) => sum + log.rejectedQty, 0)
    const bypassedQty = stepLogs.reduce((sum, log) => sum + log.bypassedQty, 0)
    const loggedQty = okQty + rejectedQty + bypassedQty
    const isLast = index === slice.length - 1
    const nextStep = slice[index + 1]

    steps.push({
      step,
      unacceptedQty: Math.max(movedInAt(step.processId) - settledAt(step.processId), 0),
      acceptedQty: availableQty,
      okQty,
      rejectedQty,
      bypassedQty,
      loggedQty,
      availableQty,
      pendingQty: Math.max(availableQty - loggedQty, 0),
      // This batch's own OK qty that the next step of the redo hasn't picked up yet.
      // Job-card movements aren't tagged per batch, so this is counted from the
      // batch's logs rather than from movement records.
      // The final step settles by being received into store, so it has a
      // ready-to-move qty like any other — capped at what this batch produced.
      readyToMoveQty:
        isLast || !nextStep
          ? Math.min(okQty, reworkPoolOut(step.processId))
          : Math.max(okQty - loggedAt(nextStep.processId), 0),
      // Never the first pass: the material was issued and consumed on the original
      // run, so the first-step material gate must not block a redo.
      isFirst: false,
      isLast,
      isCurrent: false,
    })

    // Only OK qty carries on to the next step of the redo.
    availableQty = okQty
  })

  const actionable = steps.findIndex(row => row.pendingQty > 0)
  if (steps[actionable]) steps[actionable].isCurrent = true

  return {
    review,
    steps,
    outstandingQty: steps[0]?.pendingQty ?? 0,
    finishedQty: steps.length > 0 ? steps[steps.length - 1].okQty : 0,
  }
}

/** One batch per approved Rework review, newest first. */
export function computeReworkBatches(
  routes: JobCardRouteStep[],
  reviews: RejectionReview[],
  logs: ProcessLog[],
  movements: JobCardMovement[] = [],
): ReworkBatch[] {
  return reviews.map(review => computeReworkBatch(routes, review, logs, movements))
}

import type { JobCardRouteStep, ProcessLog, RejectionReview } from '@/types/production'
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
 * batch simply carries its OK qty from one step to the next. Movement/acceptance
 * paperwork isn't part of this — the backend doesn't gate a rework log on it.
 */
export function computeReworkBatch(
  routes: JobCardRouteStep[],
  review: RejectionReview,
  logs: ProcessLog[],
): ReworkBatch {
  const sorted = [...routes].sort((a, b) => a.sequenceNo - b.sequenceNo)
  const startIndex = sorted.findIndex(step => step.processId === review.reworkProcessId)
  const batchLogs = logs.filter(log => log.inboundReworkReviewId === review.id)

  const slice = sorted.slice(Math.max(startIndex, 0))
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
      unacceptedQty: 0,
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
      readyToMoveQty: isLast || !nextStep ? 0 : Math.max(okQty - loggedAt(nextStep.processId), 0),
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
): ReworkBatch[] {
  return reviews.map(review => computeReworkBatch(routes, review, logs))
}

import type {
  JobCardMovement,
  JobCardRouteStep,
  ProcessLog,
  RejectionReview,
} from '@/types/production'
import type { StepProgress } from './jobCardProgress'

export interface ReworkSummary {
  /** Route steps from the earliest rework entry onward, every review pooled. */
  steps: StepProgress[]
  /** Reviews that sent qty back to a process, oldest first. */
  reviewsByProcess: Map<string, RejectionReview[]>
  /** Qty every approved Rework review put back on the floor. */
  totalQty: number
  /** Work still to log anywhere in the redo. */
  outstandingQty: number
  /** Qty the redo has carried to the end of the route. */
  finishedQty: number
  /** Distinct reasons behind the reviews, for the header. */
  reasons: string[]
}

/**
 * One rework pass for the whole job card rather than one table per review.
 *
 * ERP-BE keeps the rework balance per *process*, not per review (its
 * process-summary computes a 'rework' bucket for each process), and the floor
 * reads it the same way: qty sent back to Mixing is qty to redo at Mixing,
 * whichever rejection put it there. So the reviews are pooled at the process
 * each one points at, and the redo flows forward from there exactly like the
 * first pass does.
 */
export function computeReworkSummary(
  routes: JobCardRouteStep[],
  reviews: RejectionReview[],
  logs: ProcessLog[],
  movements: JobCardMovement[] = [],
): ReworkSummary {
  const sorted = [...routes].sort((a, b) => a.sequenceNo - b.sequenceNo)
  const reworkLogs = logs.filter(log => log.inboundReworkReviewId != null)
  const reworkMovements = movements.filter(movement => movement.isRework)

  // Oldest first: a log at a process cites the review that has been waiting
  // longest there, so partial redos close out in the order they were raised.
  const reviewsByProcess = new Map<string, RejectionReview[]>()
  const entryQty: Record<string, number> = {}
  for (const review of [...reviews].reverse()) {
    const processId = review.reworkProcessId
    if (!processId) continue
    entryQty[processId] = (entryQty[processId] ?? 0) + review.reviewedQty
    reviewsByProcess.set(processId, [...(reviewsByProcess.get(processId) ?? []), review])
  }

  const startIndex = sorted.findIndex(step => entryQty[step.processId] != null)
  const slice = startIndex >= 0 ? sorted.slice(startIndex) : []
  const lastProcessId = sorted[sorted.length - 1]?.processId

  const sumBy = (processId: string, pick: (log: ProcessLog) => number) =>
    reworkLogs.filter(log => log.processId === processId).reduce((sum, log) => sum + pick(log), 0)

  const movedInAt = (processId: string) =>
    reworkMovements
      .filter(movement => movement.toProcessId === processId)
      .reduce((sum, movement) => sum + movement.movedQty, 0)

  const settledAt = (processId: string) =>
    reworkMovements
      .filter(movement => movement.toProcessId === processId)
      .reduce(
        (sum, movement) =>
          sum + movement.acceptances.reduce((a, acc) => a + acc.acceptedQty + acc.shortQty, 0),
        0,
      )

  const movedOutAt = (processId: string) =>
    reworkMovements
      .filter(movement => movement.fromProcessId === processId)
      .reduce((sum, movement) => sum + movement.movedQty, 0)

  let carriedQty = 0
  const steps: StepProgress[] = slice.map((step, index) => {
    const okQty = sumBy(step.processId, log => log.okQty)
    const rejectedQty = sumBy(step.processId, log => log.rejectedQty)
    const bypassedQty = sumBy(step.processId, log => log.bypassedQty)
    const loggedQty = okQty + rejectedQty + bypassedQty
    // What arrived here to be redone: whatever a review sent back to this
    // process, plus whatever the previous step of the redo finished.
    const availableQty = (entryQty[step.processId] ?? 0) + carriedQty
    const nextStep = slice[index + 1]
    const isLast = step.processId === lastProcessId || !nextStep
    carriedQty = okQty

    return {
      step,
      unacceptedQty: Math.max(movedInAt(step.processId) - settledAt(step.processId), 0),
      acceptedQty: availableQty,
      okQty,
      rejectedQty,
      bypassedQty,
      loggedQty,
      availableQty,
      pendingQty: Math.max(availableQty - loggedQty, 0),
      // The last step settles into store, so what it may still send onward is
      // its OK qty less what the rework bucket has already moved out of it.
      readyToMoveQty: isLast
        ? Math.max(okQty - movedOutAt(step.processId), 0)
        : Math.max(
            okQty - sumBy(nextStep.processId, log => log.okQty + log.rejectedQty + log.bypassedQty),
            0,
          ),
      // Never the first pass: the material was issued and consumed on the
      // original run, so the first-step material gate must not block a redo.
      isFirst: false,
      isLast,
      isCurrent: false,
    }
  })

  const actionable = steps.findIndex(row => row.pendingQty > 0)
  if (steps[actionable]) steps[actionable].isCurrent = true

  return {
    steps,
    reviewsByProcess,
    totalQty: reviews.reduce((sum, review) => sum + review.reviewedQty, 0),
    outstandingQty: steps.reduce((sum, row) => sum + row.pendingQty, 0),
    finishedQty: steps.length > 0 ? steps[steps.length - 1].okQty : 0,
    reasons: Array.from(
      new Set(reviews.map(review => review.reasonName).filter((name): name is string => !!name)),
    ),
  }
}

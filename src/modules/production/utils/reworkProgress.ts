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
  // `is_rework`, not the review id: ERP-BE stopped requiring a review to be
  // cited, so a redo logged at a later step carries the flag and no id. Keying
  // this off the id dropped those logs out of both tables at once — the first
  // pass excludes anything flagged rework, and this would have excluded
  // anything without an id.
  const reworkLogs = logs.filter(log => log.isRework || log.inboundReworkReviewId != null)
  // ERP-BE excludes two kinds of rework movement from these figures, and the
  // same exclusions have to hold here or the columns drift apart:
  //  - a send-back to the rejecting process itself (from === to) never left the
  //    process, so it is not new incoming qty;
  //  - the auto-created send-back out of a process draws down its rejected pool,
  //    not the OK qty that "to move" tracks.
  const isSelfLoop = (movement: JobCardMovement) =>
    !!movement.reworkReviewId && movement.fromProcessId === movement.toProcessId
  const arrivals = movements.filter(movement => movement.isRework && !isSelfLoop(movement))
  const departures = movements.filter(movement => movement.isRework && !movement.reworkReviewId)

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
    arrivals
      .filter(movement => movement.toProcessId === processId)
      .reduce((sum, movement) => sum + movement.movedQty, 0)

  const settledAt = (processId: string) =>
    arrivals
      .filter(movement => movement.toProcessId === processId)
      .reduce(
        (sum, movement) =>
          sum + movement.acceptances.reduce((a, acc) => a + acc.acceptedQty + acc.shortQty, 0),
        0,
      )

  // Qty accepted into a step from the step before it in the redo. The review's
  // own send-back is not counted here — entryQty already stands for it — so a
  // step's queue never counts the same qty twice.
  const acceptedForwardAt = (processId: string) =>
    arrivals
      .filter(movement => movement.toProcessId === processId && !movement.reworkReviewId)
      .reduce(
        (sum, movement) =>
          sum + movement.acceptances.reduce((total, acc) => total + acc.acceptedQty, 0),
        0,
      )

  const movedOutAt = (processId: string) =>
    departures
      .filter(movement => movement.fromProcessId === processId)
      .reduce((sum, movement) => sum + movement.movedQty, 0)

  const steps: StepProgress[] = slice.map((step, index) => {
    const okQty = sumBy(step.processId, log => log.okQty)
    const rejectedQty = sumBy(step.processId, log => log.rejectedQty)
    const bypassedQty = sumBy(step.processId, log => log.bypassedQty)
    const loggedQty = okQty + rejectedQty + bypassedQty
    // What is actually here to redo: what a review sent back to this process,
    // plus what the previous step moved on AND this one accepted. Producing OK
    // qty upstream does not put it here — it has to be moved and accepted,
    // exactly like the first pass.
    const availableQty = (entryQty[step.processId] ?? 0) + acceptedForwardAt(step.processId)
    const nextStep = slice[index + 1]
    const isLast = step.processId === lastProcessId || !nextStep

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
      // Same rule at every step, last one included: OK qty less whatever the
      // rework bucket has already moved out of here. The last step's "move" is
      // the receipt into store.
      readyToMoveQty: Math.max(okQty - movedOutAt(step.processId), 0),
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

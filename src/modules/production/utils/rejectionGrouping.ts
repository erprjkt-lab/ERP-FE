import type { Rejection } from '@/types/production'

export interface RejectionJobCardGroup {
  jobCardId: string
  jobCardNumber: string
  rejectionIds: string[]
  processNames: string[]
  rejectedQtyTotal: number
  pendingQtyTotal: number
}

// One row per job card with a pending rejection (a job card can have several
// rejections, at one or more processes, from separate logging events � these
// get summed together).
export function groupRejectionsByJobCard(rejections: Rejection[]): RejectionJobCardGroup[] {
  const groups = new Map<string, RejectionJobCardGroup>()

  for (const r of rejections) {
    const group = groups.get(r.jobCardId) ?? {
      jobCardId: r.jobCardId,
      jobCardNumber: r.jobCardNumber ?? r.jobCardId,
      rejectionIds: [],
      processNames: [],
      rejectedQtyTotal: 0,
      pendingQtyTotal: 0,
    }
    group.rejectionIds.push(r.id)
    const processName = r.processName ?? r.processId
    if (!group.processNames.includes(processName)) group.processNames.push(processName)
    group.rejectedQtyTotal += r.rejectedQty
    group.pendingQtyTotal += r.pendingQty ?? 0
    groups.set(r.jobCardId, group)
  }

  return Array.from(groups.values())
}

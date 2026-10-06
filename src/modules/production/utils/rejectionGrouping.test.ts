import { describe, expect, it } from 'vitest'
import type { Rejection } from '@/types/production'
import { groupRejectionsByJobCard } from './rejectionGrouping'

function rejection(overrides: Partial<Rejection>): Rejection {
  return {
    id: '1',
    jobCardId: 'jc-1',
    jobCardNumber: 'JC-0001',
    processId: 'p-1',
    processName: 'Machining',
    rejectedQty: 10,
    pendingQty: 10,
    status: 'PENDING',
    ...overrides,
  }
}

describe('groupRejectionsByJobCard', () => {
  it('sums qty per job card and keeps every rejection id', () => {
    const groups = groupRejectionsByJobCard([
      rejection({ id: '1', jobCardId: 'jc-1', rejectedQty: 10, pendingQty: 4 }),
      rejection({
        id: '2',
        jobCardId: 'jc-1',
        processId: 'p-2',
        processName: 'Heat Treat',
        rejectedQty: 2,
        pendingQty: 2,
      }),
      rejection({ id: '3', jobCardId: 'jc-2', rejectedQty: 5, pendingQty: 5 }),
    ])

    const jc1 = groups.find(g => g.jobCardId === 'jc-1')!
    expect(jc1.rejectionIds).toEqual(['1', '2'])
    expect(jc1.processNames).toEqual(['Machining', 'Heat Treat'])
    expect(jc1.rejectedQtyTotal).toBe(12)
    expect(jc1.pendingQtyTotal).toBe(6)
    expect(groups).toHaveLength(2)
  })
})

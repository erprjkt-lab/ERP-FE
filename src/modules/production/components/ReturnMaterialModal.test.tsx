import { describe, expect, it } from 'vitest'
import type { MaterialIssue, MaterialReturn } from '@/types/production'
import { buildIssuedLots } from './ReturnMaterialModal'

// ERP-BE normalises an untracked component's batch/heat to GENERAL/NA on both
// issue and return, so the fixtures use those exactly as the API returns them.
function issue(over: Partial<MaterialIssue> = {}): MaterialIssue {
  return {
    id: '1',
    componentItemId: '7',
    componentName: 'Steel Rod',
    storeLocationId: '2',
    storeLocationName: 'Main Store',
    batchNo: 'B-01',
    heatNo: 'NA',
    issuedQty: 10,
    issueDate: '2026-10-21',
    ...over,
  }
}

function ret(over: Partial<MaterialReturn> = {}): MaterialReturn {
  return {
    id: '1',
    componentItemId: '7',
    componentName: 'Steel Rod',
    storeLocationId: '2',
    storeLocationName: 'Main Store',
    batchNo: 'B-01',
    heatNo: 'NA',
    returnedQty: 4,
    returnDate: '2026-10-21',
    ...over,
  }
}

describe('buildIssuedLots', () => {
  it('returns nothing until a component is picked', () => {
    expect(buildIssuedLots(undefined, [issue()], [])).toEqual([])
  })

  it('ignores issues and returns for other components', () => {
    const lots = buildIssuedLots('7', [issue(), issue({ id: '2', componentItemId: '9' })], [])
    expect(lots).toHaveLength(1)
    expect(lots[0].outstandingQty).toBe(10)
  })

  it('sums several issues of the same lot', () => {
    const lots = buildIssuedLots('7', [issue(), issue({ id: '2', issuedQty: 5 })], [])
    expect(lots).toHaveLength(1)
    expect(lots[0].outstandingQty).toBe(15)
  })

  it('keeps lots separate per location, batch and heat', () => {
    const lots = buildIssuedLots(
      '7',
      [
        issue(),
        issue({ id: '2', batchNo: 'B-02' }),
        issue({ id: '3', heatNo: 'H-9' }),
        issue({ id: '4', storeLocationId: '3' }),
      ],
      [],
    )
    expect(lots).toHaveLength(4)
  })

  it('subtracts a return only from its own lot', () => {
    const lots = buildIssuedLots(
      '7',
      [issue(), issue({ id: '2', batchNo: 'B-02' })],
      [ret({ batchNo: 'B-02', returnedQty: 3 })],
    )
    expect(lots.find(l => l.batchNo === 'B-01')?.outstandingQty).toBe(10)
    expect(lots.find(l => l.batchNo === 'B-02')?.outstandingQty).toBe(7)
  })

  it('drops a lot that has been fully returned', () => {
    expect(buildIssuedLots('7', [issue()], [ret({ returnedQty: 10 })])).toEqual([])
  })

  it('ignores a return whose lot was never issued', () => {
    const lots = buildIssuedLots('7', [issue()], [ret({ batchNo: 'B-99', returnedQty: 5 })])
    expect(lots).toHaveLength(1)
    expect(lots[0].outstandingQty).toBe(10)
  })
})

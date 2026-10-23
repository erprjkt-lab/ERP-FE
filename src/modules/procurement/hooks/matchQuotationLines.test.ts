import { describe, expect, it } from 'vitest'
import { matchQuotationLines } from './useSupplierQuotations'
import type { SupplierQuotationItem } from '@/types/procurement'

const line = (over: Partial<SupplierQuotationItem>): SupplierQuotationItem => ({
  id: '0',
  purchaseEnquiryItemId: '',
  itemId: '0',
  quotedQty: 0,
  uomId: null,
  rate: 0,
  discountPercent: 0,
  discountAmount: 0,
  taxPercent: 0,
  taxAmount: 0,
  lineTotal: 0,
  deliveryDate: null,
  ...over,
})

describe('matchQuotationLines', () => {
  it('pairs every enquiry line with the quotation line recorded against it', () => {
    const enquiryItems = [
      { id: '10', itemId: '1' },
      { id: '11', itemId: '2' },
      { id: '12', itemId: '3' },
    ]
    const quoted = [
      line({ id: 'b', purchaseEnquiryItemId: '11', itemId: '2', rate: 20 }),
      line({ id: 'c', purchaseEnquiryItemId: '12', itemId: '3', rate: 30 }),
      line({ id: 'a', purchaseEnquiryItemId: '10', itemId: '1', rate: 10 }),
    ]

    // Order of the quotation lines must not matter — this is the 2nd/3rd row bug.
    expect(matchQuotationLines(enquiryItems, quoted).map(l => l?.rate)).toEqual([10, 20, 30])
  })

  it('falls back to item_id for lines recorded without an enquiry-item link', () => {
    const enquiryItems = [{ id: '10', itemId: '1' }]
    const quoted = [line({ id: 'a', purchaseEnquiryItemId: '', itemId: '1', rate: 99 })]

    expect(matchQuotationLines(enquiryItems, quoted)[0]?.rate).toBe(99)
  })

  it('never hands the same quotation line to two enquiry rows', () => {
    // Same item listed twice on the enquiry, neither quotation line linked.
    const enquiryItems = [
      { id: '10', itemId: '1' },
      { id: '11', itemId: '1' },
    ]
    const quoted = [
      line({ id: 'a', purchaseEnquiryItemId: '', itemId: '1', rate: 10 }),
      line({ id: 'b', purchaseEnquiryItemId: '', itemId: '1', rate: 20 }),
    ]

    expect(matchQuotationLines(enquiryItems, quoted).map(l => l?.id)).toEqual(['a', 'b'])
  })

  it('lets an exact link win over a fallback that would otherwise consume it', () => {
    const enquiryItems = [
      { id: '10', itemId: '1' },
      { id: '11', itemId: '1' },
    ]
    // The unlinked line is first, but row 2 owns the linked one.
    const quoted = [
      line({ id: 'loose', purchaseEnquiryItemId: '', itemId: '1', rate: 10 }),
      line({ id: 'linked', purchaseEnquiryItemId: '11', itemId: '1', rate: 20 }),
    ]

    expect(matchQuotationLines(enquiryItems, quoted).map(l => l?.id)).toEqual(['loose', 'linked'])
  })

  it('leaves an enquiry row unmatched when nothing was quoted for it', () => {
    const enquiryItems = [
      { id: '10', itemId: '1' },
      { id: '11', itemId: '2' },
    ]
    const quoted = [line({ id: 'a', purchaseEnquiryItemId: '10', itemId: '1', rate: 10 })]

    expect(matchQuotationLines(enquiryItems, quoted).map(l => l?.id)).toEqual(['a', undefined])
  })
})

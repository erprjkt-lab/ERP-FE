import { describe, expect, it } from 'vitest'
import { toCsv } from './exportCsv'

interface Row {
  name: string
  qty: number
  note: string | null
}

const columns = [
  { header: 'Name', value: (r: Row) => r.name },
  { header: 'Qty', value: (r: Row) => r.qty },
  { header: 'Note', value: (r: Row) => r.note },
]

describe('toCsv', () => {
  it('writes a header row even with no data', () => {
    expect(toCsv<Row>([], columns)).toBe('Name,Qty,Note')
  })

  it('quotes cells containing a comma, quote or newline', () => {
    const rows: Row[] = [{ name: 'Bar, 20mm', qty: 5, note: 'say "hi"\nagain' }]
    expect(toCsv(rows, columns)).toBe('Name,Qty,Note\r\n"Bar, 20mm",5,"say ""hi""\nagain"')
  })

  it('renders null and undefined as empty cells, not the literal text', () => {
    const rows: Row[] = [{ name: 'Bolt', qty: 0, note: null }]
    expect(toCsv(rows, columns)).toBe('Name,Qty,Note\r\nBolt,0,')
  })
})

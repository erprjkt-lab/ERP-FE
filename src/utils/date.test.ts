import { describe, expect, it } from 'vitest'
import { formatDateTime } from './date'

describe('formatDateTime', () => {
  it('shows date only for a plain ERP-BE date (DATE column, no time to show)', () => {
    expect(formatDateTime('2026-10-15')).toBe('15-10-2026')
  })

  it('appends HH:mm for a real timestamp', () => {
    expect(formatDateTime('2026-10-15T09:30:00')).toBe('15-10-2026 09:30')
  })

  it('renders a dash for an empty value', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
    expect(formatDateTime('')).toBe('—')
  })

  it('passes an unparseable value through untouched', () => {
    expect(formatDateTime('not a date')).toBe('not a date')
  })
})

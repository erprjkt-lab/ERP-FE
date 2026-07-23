import { describe, expect, it } from 'vitest'
import { formatEmployeeCode } from './generateId'

describe('formatEmployeeCode', () => {
  it('pads small ids to 4 digits with an EMP- prefix', () => {
    expect(formatEmployeeCode(1)).toBe('EMP-0001')
  })

  it('pads double-digit ids correctly', () => {
    expect(formatEmployeeCode(42)).toBe('EMP-0042')
  })

  it('does not truncate ids wider than 4 digits', () => {
    expect(formatEmployeeCode(12345)).toBe('EMP-12345')
  })

  it('handles id 0', () => {
    expect(formatEmployeeCode(0)).toBe('EMP-0000')
  })
})

import { describe, expect, it } from 'vitest'
import { generateId, generateSequentialCode } from './generateCode'

describe('generateId', () => {
  it('prefixes the generated id', () => {
    expect(generateId('customer')).toMatch(/^customer-/)
  })

  it('produces an 8-character suffix', () => {
    const id = generateId('vendor')
    const suffix = id.replace('vendor-', '')
    expect(suffix).toHaveLength(8)
  })

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId('supplier')))
    expect(ids.size).toBe(20)
  })
})

describe('generateSequentialCode', () => {
  it('starts at 0001 when there are no existing records', () => {
    expect(generateSequentialCode([], 'CUST')).toBe('CUST-0001')
  })

  it('increments from the highest existing sequence number', () => {
    const existing = [{ code: 'CUST-0001' }, { code: 'CUST-0002' }, { code: 'CUST-0005' }]
    expect(generateSequentialCode(existing, 'CUST')).toBe('CUST-0006')
  })

  it('ignores ordering — finds the max regardless of array order', () => {
    const existing = [{ code: 'CUST-0009' }, { code: 'CUST-0001' }, { code: 'CUST-0003' }]
    expect(generateSequentialCode(existing, 'CUST')).toBe('CUST-0010')
  })

  it('ignores malformed codes without a trailing number', () => {
    const existing = [{ code: 'CUST-0002' }, { code: 'LEGACY' }]
    expect(generateSequentialCode(existing, 'CUST')).toBe('CUST-0003')
  })

  it('pads sequences beyond 4 digits without truncation', () => {
    const existing = [{ code: 'CUST-9999' }]
    expect(generateSequentialCode(existing, 'CUST')).toBe('CUST-10000')
  })

  it('uses the given prefix, independent of existing codes prefix', () => {
    const existing = [{ code: 'SUPP-0007' }]
    expect(generateSequentialCode(existing, 'VEND')).toBe('VEND-0008')
  })
})

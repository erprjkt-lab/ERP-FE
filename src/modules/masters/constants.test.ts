import { describe, expect, it } from 'vitest'
import { GST_REGEX, IFSC_REGEX, MOBILE_REGEX, PAN_REGEX, PINCODE_REGEX } from './constants'

describe('GST_REGEX', () => {
  it('accepts a valid GSTIN', () => {
    expect(GST_REGEX.test('27AAPFU0939F1ZV')).toBe(true)
  })

  it('rejects a too-short value', () => {
    expect(GST_REGEX.test('27AAPFU0939F1Z')).toBe(false)
  })

  it('rejects a value with letters where digits are expected', () => {
    expect(GST_REGEX.test('AAAAAAAAA939F1ZV')).toBe(false)
  })
})

describe('PAN_REGEX', () => {
  it('accepts a valid PAN', () => {
    expect(PAN_REGEX.test('AAPFU0939F')).toBe(true)
  })

  it('rejects a PAN with wrong digit count', () => {
    expect(PAN_REGEX.test('AAPFU939F')).toBe(false)
  })

  it('rejects a lowercase-mixed malformed PAN shape', () => {
    expect(PAN_REGEX.test('123456789A')).toBe(false)
  })
})

describe('IFSC_REGEX', () => {
  it('accepts a valid IFSC code', () => {
    expect(IFSC_REGEX.test('HDFC0001234')).toBe(true)
  })

  it('rejects an IFSC missing the required 0 in the 5th position', () => {
    expect(IFSC_REGEX.test('HDFC1001234')).toBe(false)
  })

  it('rejects a too-short IFSC', () => {
    expect(IFSC_REGEX.test('HDFC001')).toBe(false)
  })
})

describe('PINCODE_REGEX', () => {
  it('accepts a 6-digit pincode', () => {
    expect(PINCODE_REGEX.test('400001')).toBe(true)
  })

  it('rejects a 5-digit value', () => {
    expect(PINCODE_REGEX.test('40001')).toBe(false)
  })

  it('rejects non-numeric characters', () => {
    expect(PINCODE_REGEX.test('40000A')).toBe(false)
  })
})

describe('MOBILE_REGEX', () => {
  it('accepts a valid 10-digit Indian mobile number starting 6-9', () => {
    expect(MOBILE_REGEX.test('9876543210')).toBe(true)
  })

  it('rejects a number starting with 0-5', () => {
    expect(MOBILE_REGEX.test('5876543210')).toBe(false)
  })

  it('rejects a number with fewer than 10 digits', () => {
    expect(MOBILE_REGEX.test('987654321')).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { BRAND_GRADIENT_FROM, BRAND_GRADIENT_TO } from './brand'
import { getTonalRamp } from './color-utils'

describe('getTonalRamp', () => {
  it('returns a single color for 1 step', () => {
    expect(getTonalRamp(1)).toEqual([BRAND_GRADIENT_TO])
  })

  it('returns a single color for 0 or negative steps (steps <= 1 guard)', () => {
    expect(getTonalRamp(0)).toEqual([BRAND_GRADIENT_TO])
  })

  it('returns the requested number of steps', () => {
    expect(getTonalRamp(5)).toHaveLength(5)
  })

  it('starts at the gradient "to" color and ends at the gradient "from" color', () => {
    // mixHex reconstructs hex from parsed RGB, so it's always lowercase —
    // compare case-insensitively rather than to the (uppercase) source constant.
    const ramp = getTonalRamp(4)
    expect(ramp[0].toLowerCase()).toBe(BRAND_GRADIENT_TO.toLowerCase())
    expect(ramp[ramp.length - 1].toLowerCase()).toBe(BRAND_GRADIENT_FROM.toLowerCase())
  })

  it('produces valid hex color strings for every step', () => {
    const ramp = getTonalRamp(6)
    ramp.forEach(color => expect(color).toMatch(/^#[0-9a-f]{6}$/i))
  })
})

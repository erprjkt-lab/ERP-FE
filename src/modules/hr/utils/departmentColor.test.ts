import { describe, expect, it } from 'vitest'
import { getDepartmentColor } from './departmentColor'

describe('getDepartmentColor', () => {
  it('returns the fallback color for a null id', () => {
    expect(getDepartmentColor(null)).toBe('#8A7A76')
  })

  it('returns the fallback color for an undefined id', () => {
    expect(getDepartmentColor(undefined)).toBe('#8A7A76')
  })

  it('returns the fallback color for an empty string id', () => {
    expect(getDepartmentColor('')).toBe('#8A7A76')
  })

  it('is deterministic for the same id', () => {
    const first = getDepartmentColor('dept-1')
    const second = getDepartmentColor('dept-1')
    expect(first).toBe(second)
  })

  it('returns a hex color string', () => {
    expect(getDepartmentColor('dept-42')).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('produces different colors for different ids (not a hash collision for these samples)', () => {
    const colors = new Set(Array.from({ length: 5 }, (_, i) => getDepartmentColor(`dept-${i + 1}`)))
    expect(colors.size).toBeGreaterThan(1)
  })
})

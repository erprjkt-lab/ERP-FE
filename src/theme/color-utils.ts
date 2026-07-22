import { BRAND_GRADIENT_FROM, BRAND_GRADIENT_TO } from '@/theme/brand'

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

function mixHex(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const blue = Math.round(a.b + (b.b - a.b) * t)
  return `#${[r, g, blue].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

export function getTonalRamp(steps: number): string[] {
  if (steps <= 1) return [BRAND_GRADIENT_TO]
  return Array.from({ length: steps }, (_, i) =>
    mixHex(BRAND_GRADIENT_TO, BRAND_GRADIENT_FROM, i / (steps - 1)),
  )
}

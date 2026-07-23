import { getTonalRamp } from '@/theme/color-utils'

const FALLBACK_COLOR = '#8A7A76'
const RAMP_SIZE = 12
const RAMP = getTonalRamp(RAMP_SIZE)

function hashToIndex(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash % RAMP_SIZE
}

export function getDepartmentColor(departmentId?: string | null): string {
  if (!departmentId) return FALLBACK_COLOR
  return RAMP[hashToIndex(departmentId)]
}

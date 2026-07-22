import { getTonalRamp } from '@/theme/color-utils'
import { MOCK_DEPARTMENTS } from '../_mock/employees'

const FALLBACK_COLOR = '#8A7A76'
const RAMP = getTonalRamp(MOCK_DEPARTMENTS.length)
const DEPARTMENT_COLORS = new Map(MOCK_DEPARTMENTS.map((d, i) => [d.id, RAMP[i]]))

export function getDepartmentColor(departmentId?: string | null): string {
  return (departmentId && DEPARTMENT_COLORS.get(departmentId)) || FALLBACK_COLOR
}

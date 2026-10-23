import { apiRequest } from '@/api/client'
import type { ApiEnvelope, PaginatedEnvelope } from '@/types/api'
import type {
  ApiAttendance,
  ApiMonthlyAttendanceReport,
  AttendanceListParams,
  BulkAttendancePayload,
  MonthlyAttendanceParams,
} from '@/types/api/hr'

export function listAttendance(
  params: AttendanceListParams,
): Promise<PaginatedEnvelope<ApiAttendance>> {
  return apiRequest('/api/v1/attendance', { query: { per_page: 200, ...params } })
}

// One date, every employee on it. Each line upserts on (employee, date), so
// re-saving a day corrects it rather than erroring on the unique constraint.
export function bulkStoreAttendance(
  payload: BulkAttendancePayload,
): Promise<ApiEnvelope<ApiAttendance[]>> {
  return apiRequest('/api/v1/attendance/bulk', { method: 'POST', body: payload })
}

export function getMonthlyAttendance(
  params: MonthlyAttendanceParams,
): Promise<ApiEnvelope<ApiMonthlyAttendanceReport>> {
  return apiRequest('/api/v1/attendance/monthly-report', { query: { ...params } })
}

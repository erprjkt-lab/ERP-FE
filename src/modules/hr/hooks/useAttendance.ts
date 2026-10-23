import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bulkStoreAttendance, getMonthlyAttendance, listAttendance } from '@/api/attendance'
import type {
  ApiAttendance,
  ApiAttendanceStatus,
  BulkAttendancePayload,
  MonthlyAttendanceParams,
} from '@/types/api/hr'

/** What a day's sheet needs: who was marked, and as what. */
export interface AttendanceMark {
  id: string
  employeeId: string
  status: ApiAttendanceStatus
  remarks: string
}

function toMark(api: ApiAttendance): AttendanceMark {
  return {
    id: String(api.id),
    employeeId: String(api.employee_id),
    status: api.status,
    remarks: api.remarks ?? '',
  }
}

export function useMonthlyAttendance(params: MonthlyAttendanceParams) {
  return useQuery({
    queryKey: ['attendance', 'monthly', params],
    queryFn: async () => (await getMonthlyAttendance(params)).data,
  })
}

/** The marks already saved for one date, so the sheet opens on what is there
 *  instead of blank — re-saving the day corrects it. */
export function useAttendanceForDate(date: string, departmentId?: number) {
  const query = useQuery({
    queryKey: ['attendance', 'date', date, departmentId ?? null],
    queryFn: async () =>
      (
        await listAttendance({
          from_date: date,
          to_date: date,
          ...(departmentId ? { department_id: departmentId } : {}),
        })
      ).data.map(toMark),
  })
  return { ...query, data: query.data ?? [] }
}

export function useSaveAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkAttendancePayload) => bulkStoreAttendance(payload),
    // The monthly grid is the same records rolled up, so it has to refetch too.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  })
}

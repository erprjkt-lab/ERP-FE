export interface ApiEmployee {
  id: number
  employee_code: string | null
  employee_name: string | null
  name: string
  gender: 'male' | 'female' | 'other' | null
  date_of_birth: string | null
  branch: number
  department_id: number
  designation_id: number
  shift_id: number
  joining_date: string | null
  employee_type: string | null
  status: string | null
  role: string | null
  email: string
  username: string
  phone_number: string | null
  roles: string[]
  permissions: string[]
  created_at: string | null
  created_by: number | null
  updated_by: number | null
}

export interface EmployeePayload {
  employee_code?: string | null
  employee_name?: string | null
  name?: string
  gender?: 'male' | 'female' | 'other' | null
  date_of_birth?: string | null
  branch?: number | null
  department_id?: number | null
  designation_id?: number | null
  shift_id?: number | null
  joining_date?: string | null
  employee_type?: string | null
  status?: string | null
  role?: string | null
  email?: string
  username?: string
  phone_number?: string | null
  password?: string
}

export interface CreateEmployeePayload extends EmployeePayload {
  email: string
  password: string
}

export type UpdateEmployeePayload = EmployeePayload

export interface SyncEmployeeRolesPayload {
  roles: string[]
}

export interface SyncEmployeePermissionsPayload {
  permissions: string[]
}

export interface ApiDepartment {
  id: number
  name: string
  description?: string | null
  created_at?: string
  created_by?: number | null
  updated_by?: number | null
}

export interface CreateDepartmentPayload {
  name: string
  description?: string
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>

export interface ApiDesignation {
  id: number
  name: string
  description?: string | null
  created_at?: string
  created_by?: number | null
  updated_by?: number | null
}

export interface CreateDesignationPayload {
  name: string
  description?: string
}

export type UpdateDesignationPayload = Partial<CreateDesignationPayload>

export interface ApiShift {
  id: number
  shift_name: string
  shift_start: string
  shift_end: string
  lunch_start: string
  lunch_end: string
  created_at?: string
  created_by?: number | null
  updated_by?: number | null
}

export interface CreateShiftPayload {
  shift_name: string
  shift_start: string
  shift_end: string
  lunch_start: string
  lunch_end: string
}

export type UpdateShiftPayload = Partial<CreateShiftPayload>

/** Attendance status as ERP-BE stores it (App\Models\Attendance::STATUS_*). */
export type ApiAttendanceStatus = 1 | 2 | 3 | 4

export interface ApiAttendance {
  id: number
  employee_id: number
  employee_name?: string | null
  attendance_date: string
  status: ApiAttendanceStatus
  status_code: string | null
  status_label: string | null
  check_in_time: string | null
  check_out_time: string | null
  remarks: string | null
  created_at?: string
}

export interface BulkAttendancePayload {
  attendance_date: string
  entries: { employee_id: number; status: ApiAttendanceStatus; remarks?: string | null }[]
}

export interface AttendanceListParams {
  employee_id?: number
  department_id?: number
  from_date?: string
  to_date?: string
  per_page?: number
}

export interface MonthlyAttendanceParams {
  month: number
  year: number
  employee_id?: number
  department_id?: number
}

/** `days` is keyed by day-of-month as a string ("1".."31"); the value is the
 *  status code ("P"/"A"/"HD"/"L") or '' for a day nobody marked. */
export interface ApiMonthlyAttendanceRow {
  employee_id: number
  employee_name: string
  days: Record<string, string>
  summary: { present: number; absent: number; half_day: number; leave: number; not_marked: number }
}

export interface ApiMonthlyAttendanceReport {
  month: number
  year: number
  days_in_month: number
  employees: ApiMonthlyAttendanceRow[]
}

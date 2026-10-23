export const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
]

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Permanent', value: 'permanent' },
  { label: 'Contract', value: 'contract' },
  { label: 'Intern', value: 'intern' },
]

export const EMPLOYEE_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

/** The four attendance statuses, in the order the floor marks them. `value`
 *  is ERP-BE's integer status, `code` the letter its monthly report sends back. */
export const ATTENDANCE_STATUSES = [
  { value: 1, code: 'P', label: 'Present', color: '#16A34A' },
  { value: 2, code: 'A', label: 'Absent', color: '#DC2626' },
  { value: 3, code: 'HD', label: 'Half Day', color: '#D97706' },
  { value: 4, code: 'L', label: 'Leave', color: '#0289C3' },
] as const

export const ATTENDANCE_STATUS_BY_CODE = Object.fromEntries(
  ATTENDANCE_STATUSES.map(status => [status.code, status]),
) as Record<string, (typeof ATTENDANCE_STATUSES)[number] | undefined>

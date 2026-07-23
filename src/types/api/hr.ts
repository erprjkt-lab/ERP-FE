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

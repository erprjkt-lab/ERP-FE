import type { BaseEntity, ID, Status } from './index'

export type EmploymentType = 'permanent' | 'contract' | 'intern'
export type Gender = 'male' | 'female' | 'other'

export interface Department extends BaseEntity {
  name: string
  code: string
  managerId: ID | null
  parentId: ID | null
  headCount: number
}

export interface Designation extends BaseEntity {
  title: string
  level: number
  departmentId: ID | null
  department?: Department
}

export interface Shift extends BaseEntity {
  name: string
  startTime: string
  endTime: string
  lunchStartTime: string
  lunchEndTime: string
}

export interface Employee extends BaseEntity {
  employeeId: string
  fullName: string
  email: string
  username: string
  phone: string
  avatar?: string
  gender?: Gender
  dateOfBirth?: string
  branch?: number | null
  joinDate?: string
  exitDate?: string
  status?: Status
  employmentType?: EmploymentType
  departmentId?: ID | null
  department?: Department
  designationId?: ID | null
  designation?: Designation
  shiftId?: ID | null
  shift?: Shift
  role?: string
  managerId?: ID | null
  manager?: Pick<Employee, 'id' | 'fullName' | 'email' | 'avatar'>
  salary?: number
  currency?: string
  location?: string
}

export interface LeaveType extends BaseEntity {
  name: string
  code: string
  daysAllowed: number
  isCarryForward: boolean
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveRequest extends BaseEntity {
  employeeId: ID
  employee?: Pick<Employee, 'id' | 'fullName' | 'avatar'>
  leaveTypeId: ID
  leaveType?: LeaveType
  startDate: string
  endDate: string
  days: number
  reason: string
  status: LeaveStatus
  approvedById?: ID
  approvedAt?: string
  rejectionReason?: string
}

export interface Payroll extends BaseEntity {
  employeeId: ID
  employee?: Pick<Employee, 'id' | 'fullName'>
  month: number
  year: number
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  currency: string
  status: 'draft' | 'approved' | 'paid'
  paidAt?: string
}

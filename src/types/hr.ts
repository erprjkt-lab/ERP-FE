import type { BaseEntity, ID, Status } from './index'

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern'
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say'

export interface Department extends BaseEntity {
  name: string
  code: string
  managerId: ID | null
  parentId: ID | null
  headCount: number
}

export interface Employee extends BaseEntity {
  employeeId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  avatar?: string
  gender: Gender
  dateOfBirth: string
  joinDate: string
  exitDate?: string
  status: Status
  employmentType: EmploymentType
  departmentId: ID
  department?: Department
  designationId: ID
  designation?: Designation
  managerId: ID | null
  manager?: Pick<Employee, 'id' | 'fullName' | 'email' | 'avatar'>
  salary: number
  currency: string
  location: string
}

export interface Designation extends BaseEntity {
  title: string
  level: number
  departmentId: ID
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

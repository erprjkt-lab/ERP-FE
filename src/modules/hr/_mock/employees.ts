import type { Department, Designation, Employee } from '@/types/hr'

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Engineering', code: 'ENG', managerId: 'emp-1', parentId: null, headCount: 45, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'dept-2', name: 'Human Resources', code: 'HR', managerId: 'emp-5', parentId: null, headCount: 12, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'dept-3', name: 'Finance', code: 'FIN', managerId: 'emp-8', parentId: null, headCount: 18, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'dept-4', name: 'Operations', code: 'OPS', managerId: 'emp-12', parentId: null, headCount: 30, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'dept-5', name: 'Sales', code: 'SLS', managerId: 'emp-15', parentId: null, headCount: 25, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
]

export const MOCK_DESIGNATIONS: Designation[] = [
  { id: 'des-1', title: 'Senior Engineer', level: 4, departmentId: 'dept-1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'des-2', title: 'Engineering Manager', level: 6, departmentId: 'dept-1', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'des-3', title: 'HR Manager', level: 6, departmentId: 'dept-2', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'des-4', title: 'Financial Analyst', level: 3, departmentId: 'dept-3', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'des-5', title: 'Operations Lead', level: 5, departmentId: 'dept-4', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
]

const FIRST_NAMES = ['Arjun', 'Priya', 'Rahul', 'Anjali', 'Vikram', 'Neha', 'Rohit', 'Sneha', 'Karan', 'Pooja']
const LAST_NAMES = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Mehta', 'Nair', 'Reddy', 'Verma']

export const MOCK_EMPLOYEES: Employee[] = Array.from({ length: 30 }, (_, i) => {
  const firstName = FIRST_NAMES[i % 10]
  const lastName = LAST_NAMES[Math.floor(i / 10) % 10]
  const dept = MOCK_DEPARTMENTS[i % 5]
  const des = MOCK_DESIGNATIONS[i % 5]
  return {
    id: `emp-${i + 1}`,
    employeeId: `EMP-${String(i + 1).padStart(3, '0')}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
    phone: `+91 9${String(800000000 + i)}`,
    gender: i % 2 === 0 ? 'male' : 'female',
    dateOfBirth: `199${i % 9}-0${(i % 9) + 1}-15`,
    joinDate: `202${i % 4}-0${(i % 9) + 1}-01`,
    status: (['active', 'active', 'active', 'inactive', 'pending'] as const)[i % 5],
    employmentType: (['full-time', 'full-time', 'part-time', 'contract', 'intern'] as const)[i % 5],
    departmentId: dept.id,
    department: dept,
    designationId: des.id,
    designation: des,
    managerId: i === 0 ? null : 'emp-1',
    salary: 50000 + i * 5000,
    currency: 'INR',
    location: ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'][i % 5],
    createdAt: '2023-01-01',
    updatedAt: '2024-01-01',
  }
})

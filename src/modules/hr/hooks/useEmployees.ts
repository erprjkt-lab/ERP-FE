import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEmployee,
  deleteEmployee,
  getEmployee,
  listEmployees,
  syncEmployeeRoles,
  updateEmployee,
} from '@/api/employees'
import type { ApiEmployee, CreateEmployeePayload, UpdateEmployeePayload } from '@/types/api/hr'
import type { Department, Designation, Employee, EmploymentType, Gender, Shift } from '@/types/hr'
import { formatEmployeeCode } from '../utils/generateId'
import type { EmployeeExtra } from '../store/hrLocalStore'
import { useHRLocalStore } from '../store/hrLocalStore'
import { useDepartments } from './useDepartments'
import { useDesignations } from './useDesignations'
import { useShifts } from './useShifts'

function composeEmployee(
  api: ApiEmployee,
  extra: EmployeeExtra | undefined,
  departmentsById: Map<string, Department>,
  designationsById: Map<string, Designation>,
  shiftsById: Map<string, Shift>,
): Employee {
  const e = extra ?? {}
  const departmentId = api.department_id ? String(api.department_id) : null
  const designationId = api.designation_id ? String(api.designation_id) : null
  const shiftId = api.shift_id ? String(api.shift_id) : null

  return {
    id: String(api.id),
    employeeId: api.employee_code ?? formatEmployeeCode(api.id),
    fullName: api.employee_name || api.name,
    email: api.email,
    username: api.username,
    phone: api.phone_number ?? '',
    gender: (api.gender as Gender | null) ?? undefined,
    dateOfBirth: api.date_of_birth ?? undefined,
    branch: api.branch || null,
    joinDate: api.joining_date ?? undefined,
    status: (api.status as Employee['status']) ?? 'active',
    employmentType: (api.employee_type as EmploymentType | null) ?? undefined,
    departmentId,
    department: departmentId ? departmentsById.get(departmentId) : undefined,
    designationId,
    designation: designationId ? designationsById.get(designationId) : undefined,
    shiftId,
    shift: shiftId ? shiftsById.get(shiftId) : undefined,
    role: api.role ?? api.roles?.[0],
    managerId: null,
    salary: e.salary,
    currency: e.currency ?? 'INR',
    location: e.location,
    createdAt: api.created_at ?? '',
    updatedAt: api.created_at ?? '',
  }
}

function useLookups() {
  const departmentsQuery = useDepartments()
  const designationsQuery = useDesignations()
  const shiftsQuery = useShifts()

  return {
    departmentsById: new Map((departmentsQuery.data ?? []).map(d => [d.id, d])),
    designationsById: new Map((designationsQuery.data ?? []).map(d => [d.id, d])),
    shiftsById: new Map((shiftsQuery.data ?? []).map(s => [s.id, s])),
    isLoading: departmentsQuery.isLoading || designationsQuery.isLoading || shiftsQuery.isLoading,
  }
}

export function useEmployees() {
  const employeeExtras = useHRLocalStore(state => state.employeeExtras)
  const { departmentsById, designationsById, shiftsById, isLoading: lookupsLoading } = useLookups()
  const query = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await listEmployees()).data,
  })

  const data = query.data?.map(api =>
    composeEmployee(
      api,
      employeeExtras[String(api.id)],
      departmentsById,
      designationsById,
      shiftsById,
    ),
  )

  return { ...query, data, isLoading: query.isLoading || lookupsLoading }
}

export function useEmployee(id: string | undefined) {
  const employeeExtras = useHRLocalStore(state => state.employeeExtras)
  const { departmentsById, designationsById, shiftsById, isLoading: lookupsLoading } = useLookups()
  const query = useQuery({
    queryKey: ['employees', id],
    queryFn: async () => (await getEmployee(Number(id))).data,
    enabled: !!id,
  })

  const data =
    query.data && id
      ? composeEmployee(
          query.data,
          employeeExtras[id],
          departmentsById,
          designationsById,
          shiftsById,
        )
      : undefined

  return { ...query, data, isLoading: query.isLoading || lookupsLoading }
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  const setEmployeeExtra = useHRLocalStore(state => state.setEmployeeExtra)
  return useMutation({
    mutationFn: async ({
      payload,
      extra,
      role,
    }: {
      payload: CreateEmployeePayload
      extra: EmployeeExtra
      role?: string
    }) => {
      const result = await createEmployee(payload)
      setEmployeeExtra(String(result.data.id), extra)
      if (role) await syncEmployeeRoles(result.data.id, { roles: [role] })
      return result
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  const setEmployeeExtra = useHRLocalStore(state => state.setEmployeeExtra)
  return useMutation({
    mutationFn: async ({
      id,
      payload,
      extra,
      role,
    }: {
      id: number
      payload: UpdateEmployeePayload
      extra: EmployeeExtra
      role?: string
    }) => {
      const result = await updateEmployee(id, payload)
      setEmployeeExtra(String(id), extra)
      if (role) await syncEmployeeRoles(id, { roles: [role] })
      return result
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['employees', String(variables.id)] })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  const removeEmployeeExtra = useHRLocalStore(state => state.removeEmployeeExtra)
  return useMutation({
    mutationFn: async (id: number) => {
      await deleteEmployee(id)
      removeEmployeeExtra(String(id))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })
}

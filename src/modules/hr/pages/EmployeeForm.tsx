import { App, Button, Card, Form, Input, Select, Space } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { PageHeader } from '@/components/ui/PageHeader'
import { useRoles } from '@/hooks/useRoles'
import type { CreateEmployeePayload, UpdateEmployeePayload } from '@/types/api/hr'
import {
  BRANCH_OPTIONS,
  EMPLOYEE_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
} from '../constants'
import { useDepartments } from '../hooks/useDepartments'
import { useDesignations } from '../hooks/useDesignations'
import { useCreateEmployee, useEmployee, useUpdateEmployee } from '../hooks/useEmployees'
import { useShifts } from '../hooks/useShifts'
import type { EmployeeExtra } from '../store/hrLocalStore'

const DATE_FORMAT = 'YYYY-MM-DD'

export const EmployeeForm: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!id

  const { data: employee } = useEmployee(id)
  const { data: departments = [] } = useDepartments()
  const { data: designations = [] } = useDesignations()
  const { data: shifts = [] } = useShifts()
  const { data: roles = [] } = useRoles()
  const { mutateAsync: createEmployee, isPending: creating } = useCreateEmployee()
  const { mutateAsync: updateEmployee, isPending: updating } = useUpdateEmployee()

  const departmentId = Form.useWatch('departmentId', form)

  useEffect(() => {
    if (isEdit && employee) {
      form.setFieldsValue({
        employeeCode: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth ? dayjs(employee.dateOfBirth, DATE_FORMAT) : undefined,
        branch: employee.branch,
        departmentId: employee.departmentId ?? undefined,
        designationId: employee.designationId ?? undefined,
        shiftId: employee.shiftId ?? undefined,
        employmentType: employee.employmentType,
        joinDate: employee.joinDate ? dayjs(employee.joinDate, DATE_FORMAT) : undefined,
        status: employee.status ?? 'active',
        role: employee.role,
        salary: employee.salary,
        location: employee.location,
      })
    }
    // employee is a freshly-composed object on every render (useEmployees
    // maps over the query data each call), so depending on it directly
    // would re-run this effect — and stomp in-progress edits — on every
    // keystroke. Depend on the stable id instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, employee?.id, form])

  const departmentOptions = departments.map(d => ({ label: d.name, value: d.id }))
  const designationOptions = designations
    .filter(d => !departmentId || d.departmentId === departmentId)
    .map(d => ({ label: d.title, value: d.id }))
  const shiftOptions = shifts.map(s => ({ label: s.name, value: s.id }))
  const roleOptions = roles.map(r => ({ label: r.name, value: r.name }))

  const handleFinish = async (values: Record<string, unknown>) => {
    const role = values.role as string | undefined
    const password = values.password as string | undefined

    const basePayload: UpdateEmployeePayload = {
      name: values.fullName as string,
      email: values.email as string,
      phone_number: values.phone as string,
      gender: (values.gender as UpdateEmployeePayload['gender']) ?? null,
      date_of_birth: values.dateOfBirth
        ? (values.dateOfBirth as dayjs.Dayjs).format(DATE_FORMAT)
        : null,
      branch: values.branch ? Number(values.branch) : null,
      department_id: values.departmentId ? Number(values.departmentId) : null,
      designation_id: values.designationId ? Number(values.designationId) : null,
      shift_id: values.shiftId ? Number(values.shiftId) : null,
      joining_date: values.joinDate ? (values.joinDate as dayjs.Dayjs).format(DATE_FORMAT) : null,
      employee_type: (values.employmentType as string | undefined) ?? null,
      status: (values.status as string | undefined) ?? null,
      role: role ?? null,
    }

    const extra: EmployeeExtra = {
      salary: values.salary as number | undefined,
      currency: 'INR',
      location: values.location as string | undefined,
    }

    try {
      if (isEdit && employee) {
        const payload: UpdateEmployeePayload = { ...basePayload }
        if (password) payload.password = password
        await updateEmployee({ id: Number(employee.id), payload, extra, role })
      } else {
        const payload: CreateEmployeePayload = {
          ...basePayload,
          email: values.email as string,
          password: password as string,
        }
        await createEmployee({ payload, extra, role })
      }
      message.success(`Employee ${isEdit ? 'updated' : 'created'} successfully`)
      navigate('/hr/employees')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Employee' : 'Add Employee'}
        breadcrumbs={[
          { label: 'HR', href: '/hr' },
          { label: 'Employees', href: '/hr/employees' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/hr/employees')}>Cancel</Button>
            <Button type="primary" loading={creating || updating} onClick={() => form.submit()}>
              {isEdit ? 'Update' : 'Save'} Employee
            </Button>
          </Space>
        }
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ maxWidth: 720 }}>
          {isEdit && <FormField label="Employee Code" name="employeeCode" disabled />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Employee Name"
              name="fullName"
              placeholder="Full name"
              rules={[{ required: true, message: 'Employee name is required' }]}
            />
            <FormField
              label="Mobile Number"
              name="phone"
              placeholder="+91 9000000000"
              rules={[{ required: true, message: 'Mobile number is required' }]}
            />
          </div>

          <FormField
            label="Email"
            name="email"
            placeholder="employee@company.com"
            rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
          />

          <FormField
            label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
            name="password"
            placeholder={isEdit ? 'Leave blank to keep current password' : 'Set a password'}
            rules={
              isEdit
                ? [{ min: 6, message: 'Minimum 6 characters' }]
                : [{ required: true, min: 6, message: 'Minimum 6 characters' }]
            }
          >
            <Input.Password />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField label="Department" name="departmentId">
              <Select
                placeholder="Select department"
                options={departmentOptions}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={() => form.setFieldValue('designationId', undefined)}
              />
            </FormField>
            <FormField
              label="Designation"
              name="designationId"
              fieldType="select"
              placeholder="Select designation"
              options={designationOptions}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Branch"
              name="branch"
              fieldType="select"
              placeholder="Select branch"
              options={BRANCH_OPTIONS}
            />
            <FormField
              label="Shift"
              name="shiftId"
              fieldType="select"
              placeholder="Select shift"
              options={shiftOptions}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Employment Type"
              name="employmentType"
              fieldType="select"
              placeholder="Select type"
              options={EMPLOYMENT_TYPE_OPTIONS}
            />
            <FormField
              label="Role"
              name="role"
              fieldType="select"
              placeholder="Select role"
              options={roleOptions}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField label="Join Date" name="joinDate" fieldType="date" />
            <FormField label="Date of Birth" name="dateOfBirth" fieldType="date" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Gender"
              name="gender"
              fieldType="select"
              options={GENDER_OPTIONS}
              placeholder="Select gender"
            />
            <FormField
              label="Status"
              name="status"
              fieldType="select"
              options={EMPLOYEE_STATUS_OPTIONS}
              initialValue="active"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField label="Salary (INR)" name="salary" fieldType="number" placeholder="0" />
            <FormField label="Location" name="location" placeholder="City / Office" />
          </div>
        </Form>
      </Card>
    </div>
  )
}

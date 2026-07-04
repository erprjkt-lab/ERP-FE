import { App, Button, Card, Form, Space } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormField } from '@/components/ui/FormField'
import { PageHeader } from '@/components/ui/PageHeader'
import { MOCK_DEPARTMENTS } from '../_mock/employees'

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: 'Full Time', value: 'full-time' },
  { label: 'Part Time', value: 'part-time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Intern', value: 'intern' },
]

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer-not-to-say' },
]

export const EmployeeForm: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!id

  const handleFinish = (values: unknown) => {
    console.log('Form values:', values)
    message.success(`Employee ${isEdit ? 'updated' : 'created'} successfully`)
    navigate('/hr/employees')
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
            <Button type="primary" onClick={() => form.submit()}>
              {isEdit ? 'Update' : 'Save'} Employee
            </Button>
          </Space>
        }
      />

      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ maxWidth: 720 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="First Name"
              name="firstName"
              placeholder="First name"
              rules={[{ required: true, message: 'First name is required' }]}
            />
            <FormField
              label="Last Name"
              name="lastName"
              placeholder="Last name"
              rules={[{ required: true, message: 'Last name is required' }]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Email"
              name="email"
              placeholder="employee@company.com"
              rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
            />
            <FormField
              label="Phone"
              name="phone"
              placeholder="+91 9000000000"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Department"
              name="departmentId"
              fieldType="select"
              placeholder="Select department"
              options={MOCK_DEPARTMENTS.map(d => ({ label: d.name, value: d.id }))}
              rules={[{ required: true }]}
            />
            <FormField
              label="Employment Type"
              name="employmentType"
              fieldType="select"
              placeholder="Select type"
              options={EMPLOYMENT_TYPE_OPTIONS}
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Join Date"
              name="joinDate"
              fieldType="date"
              rules={[{ required: true }]}
            />
            <FormField
              label="Gender"
              name="gender"
              fieldType="select"
              options={GENDER_OPTIONS}
              placeholder="Select gender"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Salary (INR)"
              name="salary"
              fieldType="number"
              placeholder="0"
              rules={[{ required: true, type: 'number', min: 0 }]}
            />
            <FormField
              label="Location"
              name="location"
              placeholder="City / Office"
            />
          </div>

          <FormField
            label="Active Employee"
            name="isActive"
            fieldType="switch"
            valuePropName="checked"
            initialValue={true}
          />
        </Form>
      </Card>
    </div>
  )
}

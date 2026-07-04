import type { Meta, StoryObj } from '@storybook/react'
import { Card, Form } from 'antd'
import { FormField } from './FormField'

const DEPARTMENT_OPTIONS = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Human Resources', value: 'hr' },
  { label: 'Finance', value: 'finance' },
  { label: 'Operations', value: 'operations' },
]

const meta = {
  title: 'UI/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <Card style={{ maxWidth: 480 }}>
        <Form layout="vertical">
          <Story />
        </Form>
      </Card>
    ),
  ],
  argTypes: {
    fieldType: {
      control: 'select',
      options: ['text', 'textarea', 'number', 'select', 'switch', 'date'],
    },
  },
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

export const TextField: Story = {
  args: {
    label: 'Full Name',
    name: 'fullName',
    placeholder: 'Enter full name',
    rules: [{ required: true, message: 'Full name is required' }],
  },
}

export const SelectField: Story = {
  args: {
    label: 'Department',
    name: 'department',
    fieldType: 'select',
    placeholder: 'Select department',
    options: DEPARTMENT_OPTIONS,
    rules: [{ required: true }],
  },
}

export const NumberField: Story = {
  args: {
    label: 'Salary',
    name: 'salary',
    fieldType: 'number',
    placeholder: '0',
    rules: [{ required: true, type: 'number', min: 0 }],
  },
}

export const DateField: Story = {
  args: {
    label: 'Join Date',
    name: 'joinDate',
    fieldType: 'date',
    rules: [{ required: true }],
  },
}

export const SwitchField: Story = {
  args: {
    label: 'Active Employee',
    name: 'isActive',
    fieldType: 'switch',
    valuePropName: 'checked',
  },
}

export const TextareaField: Story = {
  args: {
    label: 'Notes',
    name: 'notes',
    fieldType: 'textarea',
    placeholder: 'Add any notes...',
  },
}

export const FullEmployeeForm: Story = {
  render: () => (
    <Card style={{ maxWidth: 600 }}>
      <Form layout="vertical" initialValues={{ isActive: true }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <FormField
            label="First Name"
            name="firstName"
            placeholder="First name"
            rules={[{ required: true }]}
          />
          <FormField
            label="Last Name"
            name="lastName"
            placeholder="Last name"
            rules={[{ required: true }]}
          />
        </div>
        <FormField
          label="Email"
          name="email"
          placeholder="employee@company.com"
          rules={[{ required: true, type: 'email' }]}
        />
        <FormField
          label="Department"
          name="department"
          fieldType="select"
          options={DEPARTMENT_OPTIONS}
          placeholder="Select department"
          rules={[{ required: true }]}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <FormField
            label="Salary"
            name="salary"
            fieldType="number"
            placeholder="0"
            rules={[{ required: true }]}
          />
          <FormField
            label="Join Date"
            name="joinDate"
            fieldType="date"
            rules={[{ required: true }]}
          />
        </div>
        <FormField
          label="Active"
          name="isActive"
          fieldType="switch"
          valuePropName="checked"
        />
        <FormField
          label="Notes"
          name="notes"
          fieldType="textarea"
          placeholder="Additional notes..."
        />
      </Form>
    </Card>
  ),
}

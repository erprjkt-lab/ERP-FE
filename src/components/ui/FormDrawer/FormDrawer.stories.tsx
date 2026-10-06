import type { Meta, StoryObj } from '@storybook/react'
import { Button, Form } from 'antd'
import { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from '@/components/ui/FormSection'
import { FormDrawer } from './FormDrawer'

const DEPARTMENT_OPTIONS = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Human Resources', value: 'hr' },
  { label: 'Finance', value: 'finance' },
  { label: 'Operations', value: 'operations' },
]

const SKILL_OPTIONS = [
  { label: 'React', value: 'react' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Node.js', value: 'node' },
  { label: 'SQL', value: 'sql' },
]

const meta = {
  title: 'UI/FormDrawer',
  component: FormDrawer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    status: {
      control: 'select',
      options: [undefined, 'draft', 'pending', 'approved', 'rejected', 'active'],
    },
    placement: {
      control: 'select',
      options: ['left', 'right', 'top', 'bottom'],
    },
  },
} satisfies Meta<typeof FormDrawer>

export default meta
type Story = StoryObj<typeof meta>

/** Minimal shell — a title, body, and the default Cancel/Submit footer. */
export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button type="primary" onClick={() => setOpen(true)}>
          Open Drawer
        </Button>
        <FormDrawer
          title="Add Remark"
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={() => setOpen(false)}
        >
          Drawer body content goes here.
        </FormDrawer>
      </>
    )
  },
}

/** Full configuration: text field, dropdown, multi-select, status tag, loading submit. */
export const FullForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [form] = Form.useForm()

    const handleSubmit = async () => {
      try {
        await form.validateFields()
      } catch {
        return
      }
      setSubmitting(true)
      setTimeout(() => {
        setSubmitting(false)
        setOpen(false)
      }, 800)
    }

    return (
      <>
        <Button type="primary" onClick={() => setOpen(true)}>
          Add Employee
        </Button>
        <FormDrawer
          title="Add Employee"
          status="pending"
          open={open}
          width={480}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitText="Save Employee"
        >
          <Form form={form} layout="vertical">
            <FormSection title="Basic Details">
              <FormField
                label="Full Name"
                name="fullName"
                placeholder="Enter full name"
                rules={[{ required: true, message: 'Full name is required' }]}
              />
              <FormField
                label="Department"
                name="department"
                fieldType="select"
                placeholder="Select department"
                options={DEPARTMENT_OPTIONS}
                rules={[{ required: true, message: 'Department is required' }]}
              />
              <FormField
                label="Skills"
                name="skills"
                fieldType="multiselect"
                placeholder="Select skills"
                options={SKILL_OPTIONS}
              />
            </FormSection>
            <FormSection title="Other">
              <FormField
                label="Notes"
                name="notes"
                fieldType="textarea"
                placeholder="Optional notes"
              />
            </FormSection>
          </Form>
        </FormDrawer>
      </>
    )
  },
}

/** Read-only panel — no footer, just a Close via the drawer's own X icon. */
export const ReadOnly: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>View Details</Button>
        <FormDrawer
          title="Employee Details"
          status="active"
          hideFooter
          open={open}
          onClose={() => setOpen(false)}
        >
          Read-only content — pass hideFooter to drop the Cancel/Submit row.
        </FormDrawer>
      </>
    )
  },
}

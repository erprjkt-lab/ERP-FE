import { Col, Row } from 'antd'
import type { Meta, StoryObj } from '@storybook/react'
import { FormField } from '@/components/ui/FormField'
import { FormSection } from './FormSection'

const meta = {
  title: 'UI/FormSection',
  component: FormSection,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FormSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Personal Information',
    description: undefined,
    children: (
      <Row gutter={24}>
        <Col span={8}>
          <FormField label="Employee Name" name="fullName" placeholder="Full name" />
        </Col>
        <Col span={8}>
          <FormField label="Mobile Number" name="phone" placeholder="+91 9000000000" />
        </Col>
        <Col span={8}>
          <FormField label="Email" name="email" placeholder="employee@company.com" />
        </Col>
      </Row>
    ),
  },
}

export const WithDescription: Story = {
  args: {
    title: 'Account',
    description: 'Login credentials for this employee.',
    children: (
      <Row gutter={24}>
        <Col span={12}>
          <FormField label="Employee Code" name="employeeCode" disabled />
        </Col>
        <Col span={12}>
          <FormField
            label="Password"
            name="password"
            fieldType="text"
            placeholder="Set a password"
          />
        </Col>
      </Row>
    ),
  },
}

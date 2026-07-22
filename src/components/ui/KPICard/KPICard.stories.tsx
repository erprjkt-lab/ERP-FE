import {
  TeamOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { Col, Row } from 'antd'
import { KPICard } from './KPICard'

const meta = {
  title: 'UI/KPICard',
  component: KPICard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    loading: { control: 'boolean' },
  },
} satisfies Meta<typeof KPICard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Total Employees',
    value: 248,
    prefix: <TeamOutlined />,
    trend: { value: 12, label: 'vs last month' },
  },
}

export const Loading: Story = {
  args: {
    title: 'Total Employees',
    value: 0,
    loading: true,
  },
}

export const NegativeTrend: Story = {
  args: {
    title: 'Employee Attrition',
    value: 3,
    suffix: 'this month',
    trend: { value: -2 },
    color: '#ff4d4f',
  },
}

export const DashboardGrid: Story = {
  args: { title: 'Dashboard', value: 0 },
  render: () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <KPICard
          title="Total Employees"
          value={248}
          prefix={<TeamOutlined />}
          trend={{ value: 12 }}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KPICard
          title="Monthly Payroll"
          value={1240000}
          prefix={<DollarOutlined />}
          formatter={v => `₹${Number(v).toLocaleString('en-IN')}`}
          trend={{ value: 3.2 }}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KPICard
          title="Pending Leaves"
          value={14}
          prefix={<ClockCircleOutlined />}
          color="#fa8c16"
          trend={{ value: -5 }}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <KPICard
          title="On Time Attendance"
          value={94.2}
          suffix="%"
          prefix={<CheckCircleOutlined />}
          color="#52c41a"
          trend={{ value: 1.8 }}
        />
      </Col>
    </Row>
  ),
}

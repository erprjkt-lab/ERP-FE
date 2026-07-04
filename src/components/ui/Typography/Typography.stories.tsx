import type { Meta, StoryObj } from '@storybook/react'
import { Divider, Space, Typography as AntTypography } from 'antd'

const { Title, Text, Paragraph, Link } = AntTypography

const meta = {
  title: 'UI/Typography',
  component: AntTypography,
  tags: ['autodocs'],
  parameters: { layout: 'padded', backgrounds: { default: 'white' } },
} satisfies Meta<typeof AntTypography>

export default meta
type Story = StoryObj<typeof meta>

export const Headings: Story = {
  render: () => (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Title level={1}>H1 — Page Title</Title>
      <Title level={2}>H2 — Section Title</Title>
      <Title level={3}>H3 — Module Header</Title>
      <Title level={4}>H4 — Card Title</Title>
      <Title level={5}>H5 — Subsection</Title>
    </Space>
  ),
}

export const TextVariants: Story = {
  render: () => (
    <Space direction="vertical" size="middle">
      <Space wrap>
        <Text>Default</Text>
        <Text strong>Bold</Text>
        <Text italic>Italic</Text>
        <Text underline>Underline</Text>
        <Text delete>Strikethrough</Text>
        <Text code>code</Text>
        <Text keyboard>Ctrl+K</Text>
        <Text mark>Highlighted</Text>
      </Space>
      <Divider />
      <Space wrap>
        <Text type="secondary">Secondary</Text>
        <Text type="success">Success</Text>
        <Text type="warning">Warning</Text>
        <Text type="danger">Danger</Text>
        <Text disabled>Disabled</Text>
      </Space>
    </Space>
  ),
}

export const ERPUsage: Story = {
  render: () => (
    <div style={{ maxWidth: 500 }}>
      <Title level={3} style={{ marginBottom: 4 }}>John Doe</Title>
      <Text type="secondary">EMP-001 · Engineering · Senior Engineer</Text>
      <Divider />
      <Paragraph>
        Joined the company on <Text strong>January 15, 2022</Text>. Currently assigned to the{' '}
        <Link href="#">Platform Team</Link> working on the core infrastructure.
      </Paragraph>
      <Text type="warning">⚠ Leave balance below threshold (2 days remaining)</Text>
    </div>
  ),
}

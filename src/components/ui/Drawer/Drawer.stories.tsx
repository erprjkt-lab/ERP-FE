import type { Meta, StoryObj } from '@storybook/react'
import { Button, Descriptions, Tag } from 'antd'
import { useState } from 'react'
import { Drawer } from './Drawer'

const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button type="primary" onClick={() => setOpen(true)}>View Employee</Button>
        <Drawer title="Employee Details" open={open} onClose={() => setOpen(false)}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Name">John Doe</Descriptions.Item>
            <Descriptions.Item label="Employee ID">EMP-001</Descriptions.Item>
            <Descriptions.Item label="Department">Engineering</Descriptions.Item>
            <Descriptions.Item label="Designation">Senior Engineer</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color="green">Active</Tag></Descriptions.Item>
            <Descriptions.Item label="Email">john.doe@company.com</Descriptions.Item>
            <Descriptions.Item label="Join Date">2022-01-15</Descriptions.Item>
          </Descriptions>
        </Drawer>
      </>
    )
  },
}

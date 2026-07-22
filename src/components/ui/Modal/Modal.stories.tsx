import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Button, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Modal } from './Modal'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button type="primary" onClick={() => setOpen(true)}>
          Open Modal
        </Button>
        <Modal
          title="Confirm Action"
          open={open}
          onOk={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        >
          <Typography.Text>Are you sure you want to perform this action?</Typography.Text>
        </Modal>
      </>
    )
  },
}

export const FormModal: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    const [form] = Form.useForm()
    return (
      <>
        <Button type="primary" onClick={() => setOpen(true)}>
          Add Department
        </Button>
        <Modal
          title="Add Department"
          open={open}
          onOk={() => form.submit()}
          onCancel={() => {
            setOpen(false)
            form.resetFields()
          }}
          okText="Save"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={() => setOpen(false)}
            style={{ marginTop: 16 }}
          >
            <Form.Item label="Department Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="e.g. Engineering" />
            </Form.Item>
            <Form.Item label="Code" name="code" rules={[{ required: true }]}>
              <Input placeholder="e.g. ENG" />
            </Form.Item>
          </Form>
        </Modal>
      </>
    )
  },
}

export const Destructive: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button danger onClick={() => setOpen(true)}>
          Delete Employee
        </Button>
        <Modal
          title="Delete Employee"
          open={open}
          onOk={fn()}
          onCancel={() => setOpen(false)}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Typography.Text>
            Are you sure you want to delete <strong>John Doe</strong>? This action cannot be undone.
          </Typography.Text>
        </Modal>
      </>
    )
  },
}

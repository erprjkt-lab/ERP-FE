import type { Meta, StoryObj } from '@storybook/react'
import { Card, Form } from 'antd'
import { UploadField } from './UploadField'

const meta = {
  title: 'UI/UploadField',
  component: UploadField,
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
} satisfies Meta<typeof UploadField>

export default meta
type Story = StoryObj<typeof meta>

export const ImageMode: Story = {
  render: () => (
    <Form.Item label="Image" name="imageUrl">
      <UploadField mode="image" accept="image/*" />
    </Form.Item>
  ),
}

export const FileMode: Story = {
  render: () => (
    <Form.Item label="Drawing File" name="drawingFileName">
      <UploadField mode="file" accept=".pdf,.dwg,.dxf" />
    </Form.Item>
  ),
}

import { render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { describe, expect, it } from 'vitest'
import { FormField } from './FormField'

function renderInForm(children: React.ReactNode) {
  const Wrapper = () => {
    const [form] = Form.useForm()
    return <Form form={form}>{children}</Form>
  }
  return render(<Wrapper />)
}

describe('FormField', () => {
  it('renders a plain text input by default', () => {
    renderInForm(<FormField label="Name" name="name" placeholder="Full name" />)
    expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Full name').tagName).toBe('INPUT')
  })

  it('renders the label', () => {
    renderInForm(<FormField label="Employee Name" name="name" />)
    expect(screen.getByText('Employee Name')).toBeInTheDocument()
  })

  it('shows a required asterisk when a required rule is given', () => {
    const { container } = renderInForm(
      <FormField label="Email" name="email" rules={[{ required: true }]} />,
    )
    expect(container.querySelector('.ant-form-item-required')).toBeInTheDocument()
  })

  it('renders a textarea for fieldType="textarea"', () => {
    renderInForm(<FormField label="Address" name="address" fieldType="textarea" />)
    expect(document.querySelector('textarea')).toBeInTheDocument()
  })

  it('renders a number input for fieldType="number"', () => {
    const { container } = renderInForm(
      <FormField label="Salary" name="salary" fieldType="number" />,
    )
    expect(container.querySelector('.ant-input-number')).toBeInTheDocument()
  })

  it('renders a select with the given options for fieldType="select"', () => {
    const { container } = renderInForm(
      <FormField
        label="Status"
        name="status"
        fieldType="select"
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
      />,
    )
    expect(container.querySelector('.ant-select')).toBeInTheDocument()
  })

  it('renders a switch for fieldType="switch"', () => {
    renderInForm(<FormField label="Enabled" name="enabled" fieldType="switch" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders a date picker for fieldType="date"', () => {
    const { container } = renderInForm(
      <FormField label="Join Date" name="joinDate" fieldType="date" />,
    )
    expect(container.querySelector('.ant-picker')).toBeInTheDocument()
  })

  it('renders a time picker for fieldType="time"', () => {
    const { container } = renderInForm(
      <FormField label="Start Time" name="startTime" fieldType="time" />,
    )
    expect(container.querySelector('.ant-picker')).toBeInTheDocument()
  })

  it('forwards disabled to the rendered control', () => {
    renderInForm(<FormField label="Name" name="name" placeholder="Full name" disabled />)
    expect(screen.getByPlaceholderText('Full name')).toBeDisabled()
  })

  it('renders custom children instead of the fieldType-based control when given', () => {
    renderInForm(
      <FormField label="Custom" name="custom">
        <input data-testid="custom-input" />
      </FormField>,
    )
    expect(screen.getByTestId('custom-input')).toBeInTheDocument()
  })
})

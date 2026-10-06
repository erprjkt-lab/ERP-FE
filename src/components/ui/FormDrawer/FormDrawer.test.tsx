import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormDrawer } from './FormDrawer'

describe('FormDrawer', () => {
  it('renders its title and content when open', () => {
    render(
      <FormDrawer open title="Add Employee">
        <p>Form goes here</p>
      </FormDrawer>,
    )
    expect(screen.getByText('Add Employee')).toBeInTheDocument()
    expect(screen.getByText('Form goes here')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <FormDrawer open={false} title="Add Employee">
        <p>Form goes here</p>
      </FormDrawer>,
    )
    expect(screen.queryByText('Form goes here')).not.toBeInTheDocument()
  })

  it('shows a status tag next to the title when given', () => {
    render(
      <FormDrawer open title="Purchase Order" status="pending">
        content
      </FormDrawer>,
    )
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('calls onSubmit when Submit is clicked', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <FormDrawer open title="Add Employee" onSubmit={onSubmit}>
        content
      </FormDrawer>,
    )
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('falls back to onClose when onCancel is not given', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <FormDrawer open title="Add Employee" onClose={onClose}>
        content
      </FormDrawer>,
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses custom submit/cancel labels', () => {
    render(
      <FormDrawer open title="Add Employee" submitText="Save" cancelText="Discard">
        content
      </FormDrawer>,
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument()
  })

  it('hides the footer when hideFooter is set', () => {
    render(
      <FormDrawer open title="Details" hideFooter>
        content
      </FormDrawer>,
    )
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })
})

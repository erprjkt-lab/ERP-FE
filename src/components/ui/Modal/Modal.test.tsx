import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders its title and content when open', () => {
    render(
      <Modal open title="Add Department">
        <p>Form goes here</p>
      </Modal>,
    )
    expect(screen.getByText('Add Department')).toBeInTheDocument()
    expect(screen.getByText('Form goes here')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <Modal open={false} title="Add Department">
        <p>Form goes here</p>
      </Modal>,
    )
    expect(screen.queryByText('Form goes here')).not.toBeInTheDocument()
  })

  it('calls onCancel when the Cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <Modal open title="Add Department" onCancel={onCancel}>
        content
      </Modal>,
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onOk when the OK button is clicked', async () => {
    const user = userEvent.setup()
    const onOk = vi.fn()
    render(
      <Modal open title="Add Department" onOk={onOk}>
        content
      </Modal>,
    )
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onOk).toHaveBeenCalledTimes(1)
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('defaults to a "No data" title', () => {
    // antd's default empty-state SVG also has a <title>No data</title> for
    // accessibility, so scope the query to our own description text.
    render(<EmptyState />)
    expect(document.querySelector('.ant-empty-description strong')).toHaveTextContent('No data')
  })

  it('renders a custom title and description', () => {
    render(<EmptyState title="No employees yet" description="Add your first employee." />)
    expect(screen.getByText('No employees yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first employee.')).toBeInTheDocument()
  })

  it('does not render an action button by default', () => {
    render(<EmptyState />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders and wires up the action button', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<EmptyState action={{ label: 'Add Employee', onClick }} />)
    await user.click(screen.getByRole('button', { name: 'Add Employee' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

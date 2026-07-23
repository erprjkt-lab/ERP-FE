import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders the default label for a known status as a tag', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders a custom label override', () => {
    render(<StatusBadge status="active" label="Currently Active" />)
    expect(screen.getByText('Currently Active')).toBeInTheDocument()
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('renders a dot variant using Badge', () => {
    const { container } = render(<StatusBadge status="pending" variant="dot" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(container.querySelector('.ant-badge-status-processing')).toBeInTheDocument()
  })

  it('renders a text variant as plain colored text', () => {
    const { container } = render(<StatusBadge status="cancelled" variant="text" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(container.querySelector('.ant-tag')).not.toBeInTheDocument()
  })

  it('falls back to the raw status string for an unmapped status', () => {
    // @ts-expect-error intentionally passing an unmapped status to exercise the fallback branch
    render(<StatusBadge status="something-unmapped" />)
    expect(screen.getByText('something-unmapped')).toBeInTheDocument()
  })
})

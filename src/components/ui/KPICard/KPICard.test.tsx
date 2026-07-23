import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KPICard } from './KPICard'

describe('KPICard', () => {
  it('renders the title and value', () => {
    render(<KPICard title="Total Employees" value={30} />)
    expect(screen.getByText('Total Employees')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('applies a custom formatter to the value', () => {
    render(<KPICard title="Monthly Payroll" value={367500} formatter={v => `₹${v}`} />)
    expect(screen.getByText('₹367500')).toBeInTheDocument()
  })

  it('shows an up arrow and the trend percentage for a positive trend', () => {
    render(<KPICard title="Active Employees" value={18} trend={{ value: 12 }} />)
    expect(screen.getByText('12% vs last month')).toBeInTheDocument()
  })

  it('shows a custom trend label instead of the default when given', () => {
    render(<KPICard title="Pending Leaves" value={14} trend={{ value: -5, label: 'this week' }} />)
    expect(screen.getByText('5% this week')).toBeInTheDocument()
  })

  it('does not render trend text when no trend is given', () => {
    render(<KPICard title="Total Employees" value={30} />)
    expect(screen.queryByText(/vs last month/)).not.toBeInTheDocument()
  })

  it('shows a loading skeleton instead of the value when loading', () => {
    render(<KPICard title="Total Employees" value={30} loading />)
    expect(screen.queryByText('30')).not.toBeInTheDocument()
  })
})

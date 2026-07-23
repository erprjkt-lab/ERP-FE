import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Employees" />)
    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument()
  })

  it('renders the subtitle when given', () => {
    render(<PageHeader title="Employees" subtitle="30 of 30 employees" />)
    expect(screen.getByText('30 of 30 employees')).toBeInTheDocument()
  })

  it('does not render a breadcrumb when none is given', () => {
    render(<PageHeader title="Employees" />)
    expect(document.querySelector('.ant-breadcrumb')).not.toBeInTheDocument()
  })

  it('renders breadcrumb items, linking only ones with an href', () => {
    render(
      <PageHeader
        title="Employee Detail"
        breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Employees' }]}
      />,
    )
    const hrLink = screen.getByRole('link', { name: 'HR' })
    expect(hrLink).toHaveAttribute('href', '/hr')
    expect(document.querySelector('.ant-breadcrumb')).toHaveTextContent('Employees')
  })

  it('renders actions', () => {
    render(<PageHeader title="Employees" actions={<button type="button">Add Employee</button>} />)
    expect(screen.getByRole('button', { name: 'Add Employee' })).toBeInTheDocument()
  })

  it('renders children with a divider only when children are given', () => {
    const { rerender } = render(<PageHeader title="Employees" />)
    expect(document.querySelector('.ant-divider')).not.toBeInTheDocument()

    rerender(
      <PageHeader title="Employees">
        <div>Filter row</div>
      </PageHeader>,
    )
    expect(screen.getByText('Filter row')).toBeInTheDocument()
    expect(document.querySelector('.ant-divider')).toBeInTheDocument()
  })
})

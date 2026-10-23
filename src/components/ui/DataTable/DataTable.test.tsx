import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from './DataTable'

interface Row {
  id: string
  name: string
}

const columns = [{ title: 'Name', dataIndex: 'name', key: 'name' }]
const data: Row[] = Array.from({ length: 25 }, (_, i) => ({ id: String(i), name: `Row ${i}` }))

describe('DataTable', () => {
  it('renders the given columns and rows', () => {
    // antd's sticky header renders a second, visually-hidden copy of each
    // column title for width measurement, so query the real header cell by role.
    render(<DataTable<Row> columns={columns} dataSource={data.slice(0, 3)} rowKey="id" />)
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByText('Row 0')).toBeInTheDocument()
  })

  it('uses the custom totalLabel in the pagination summary', () => {
    render(
      <DataTable<Row> columns={columns} dataSource={data} rowKey="id" totalLabel="employees" />,
    )
    expect(screen.getByText(/of 25 employees/)).toBeInTheDocument()
  })

  it('defaults the total label to "records" when none is given', () => {
    render(<DataTable<Row> columns={columns} dataSource={data} rowKey="id" />)
    expect(screen.getByText(/of 25 records/)).toBeInTheDocument()
  })

  it('hides pagination entirely when pagination={false}', () => {
    render(<DataTable<Row> columns={columns} dataSource={data} rowKey="id" pagination={false} />)
    expect(document.querySelector('.ant-pagination')).not.toBeInTheDocument()
  })

  it('adds the fill-height class when fillHeight is set', () => {
    const { container } = render(
      <DataTable<Row> columns={columns} dataSource={data} rowKey="id" fillHeight />,
    )
    expect(container.querySelector('.erp-fill-height-table')).toBeInTheDocument()
  })

  it('does not add the fill-height class by default', () => {
    const { container } = render(<DataTable<Row> columns={columns} dataSource={data} rowKey="id" />)
    expect(container.querySelector('.erp-fill-height-table')).not.toBeInTheDocument()
  })

  it('preserves a caller-supplied className alongside the fill-height class', () => {
    const { container } = render(
      <DataTable<Row>
        columns={columns}
        dataSource={data}
        rowKey="id"
        fillHeight
        className="my-table"
      />,
    )
    const wrapper = container.querySelector('.ant-table-wrapper') as HTMLElement
    expect(wrapper.className).toContain('erp-fill-height-table')
    expect(wrapper.className).toContain('my-table')
  })

  it('renders floating row action popover on row hover without adding any table columns', () => {
    const { container } = render(
      <DataTable<Row>
        columns={columns}
        dataSource={data.slice(0, 3)}
        rowKey="id"
        rowActions={record => [
          { key: 'edit', label: `Edit ${record.name}`, icon: <span>EditIcon</span> },
        ]}
      />,
    )

    // Verify there are no extra columns in the table header
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(1)
    expect(headers[0]).toHaveTextContent('Name')

    // Before hover, no floating popover
    expect(container.querySelector('.erp-floating-row-action-popover')).not.toBeInTheDocument()

    // Hover over the first data row
    const firstRow = container.querySelector('.ant-table-row') as HTMLElement
    fireEvent.mouseEnter(firstRow)

    // Floating popover appears with the action button
    expect(container.querySelector('.erp-floating-row-action-popover')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Row 0' })).toBeInTheDocument()
  })

  it('renders application card list view on mobile screens', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query.includes('767.98px'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    const { container } = render(
      <DataTable<Row>
        columns={columns}
        dataSource={data.slice(0, 3)}
        rowKey="id"
        rowActions={record => [
          { key: 'edit', label: `Edit ${record.name}`, icon: <span>EditIcon</span> },
        ]}
      />,
    )

    expect(container.querySelector('.erp-mobile-card-view')).toBeInTheDocument()
    expect(container.querySelectorAll('.erp-mobile-card')).toHaveLength(3)
    expect(container.querySelector('.erp-mobile-card-avatar')).toBeInTheDocument()

    window.matchMedia = originalMatchMedia
  })

  // Pages that render their buttons in an "Action" column rather than via
  // `rowActions` used to lose them completely on mobile: the card extractor
  // filtered the column out and nothing rendered it anywhere else.
  it('keeps buttons from an Action column reachable on mobile cards', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query.includes('767.98px'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia

    const onApprove = vi.fn()
    const { container } = render(
      <DataTable<Row>
        columns={[
          ...columns,
          {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: Row) => (
              <button onClick={() => onApprove(record.id)}>Approve {record.name}</button>
            ),
          },
        ]}
        dataSource={data.slice(0, 2)}
        rowKey="id"
      />,
    )

    expect(container.querySelectorAll('.erp-mobile-card-actions')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Approve Row 0' }))
    expect(onApprove).toHaveBeenCalledWith('0')

    window.matchMedia = originalMatchMedia
  })
})

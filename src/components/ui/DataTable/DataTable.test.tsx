import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})

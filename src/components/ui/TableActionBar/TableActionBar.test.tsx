import { EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TableActionBar, TableActionButton, createTableActionsColumn } from './TableActionBar'
import type { TableActionItem } from './TableActionBar'

describe('TableActionBar', () => {
  it('renders actions using aria-label and tooltips', () => {
    const actions: TableActionItem[] = [
      { key: 'edit', label: 'Edit', icon: <EditOutlined /> },
      { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true },
    ]

    render(<TableActionBar actions={actions} />)

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('triggers onClick when button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    const actions: TableActionItem[] = [
      { key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: onEdit },
    ]

    render(<TableActionBar actions={actions} />)
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('stops event propagation on click to avoid triggering row clicks', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const onEdit = vi.fn()

    render(
      <div onClick={onRowClick}>
        <TableActionBar
          actions={[{ key: 'edit', label: 'Edit', icon: <EditOutlined />, onClick: onEdit }]}
        />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('does not trigger onClick when action is disabled', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()

    render(
      <TableActionBar
        actions={[
          {
            key: 'edit',
            label: 'Edit',
            icon: <EditOutlined />,
            onClick: onEdit,
            disabled: true,
          },
        ]}
      />,
    )

    const button = screen.getByRole('button', { name: 'Edit' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('filters out hidden, null, or undefined actions', () => {
    const actions: (TableActionItem | null | undefined | false)[] = [
      { key: 'edit', label: 'Edit', icon: <EditOutlined /> },
      null,
      false,
      undefined,
      { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, hidden: true },
    ]

    render(<TableActionBar actions={actions} />)

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    render(
      <TableActionBar
        actions={[
          { key: 'approve', label: 'Approve', icon: <CheckOutlined />, variant: 'success' },
          { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, variant: 'danger' },
        ]}
      />,
    )

    const approveBtn = screen.getByRole('button', { name: 'Approve' })
    const deleteBtn = screen.getByRole('button', { name: 'Delete' })

    expect(approveBtn.className).toContain('erp-table-action-btn--success')
    expect(deleteBtn.className).toContain('erp-table-action-btn--danger')
  })

  it('renders custom children via TableActionButton', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <TableActionBar>
        <TableActionButton label="Custom Action" icon={<CheckOutlined />} onClick={onClick} />
      </TableActionBar>,
    )

    const button = screen.getByRole('button', { name: 'Custom Action' })
    expect(button).toBeInTheDocument()
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('createTableActionsColumn generates a valid table column definition', () => {
    const column = createTableActionsColumn<{ id: string }>({
      width: 170,
      actions: _record => [{ key: 'edit', label: 'Edit', icon: <EditOutlined /> }],
    })

    expect(column.key).toBe('actions')
    expect(column.fixed).toBe('right')
    expect(column.width).toBe(170)
    expect(column.align).toBe('right')
    expect(column.className).toBe('erp-table-actions-cell')
  })
})

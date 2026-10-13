import { Tooltip } from 'antd'
import type { TableColumnType } from 'antd'
import type { FC, MouseEvent, ReactNode } from 'react'
import './TableActionBar.css'

export type TableActionVariant = 'default' | 'primary' | 'danger' | 'success' | 'warning' | 'accent'

export interface TableActionItem {
  key: string
  label: string
  icon: ReactNode
  onClick?: (e: MouseEvent<HTMLElement>) => void
  danger?: boolean
  variant?: TableActionVariant
  disabled?: boolean
  hidden?: boolean
  loading?: boolean
}

export interface TableActionButtonProps {
  label: string
  icon: ReactNode
  onClick?: (e: MouseEvent<HTMLElement>) => void
  danger?: boolean
  variant?: TableActionVariant
  disabled?: boolean
  loading?: boolean
  className?: string
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

export const TableActionButton: FC<TableActionButtonProps> = ({
  label,
  icon,
  onClick,
  danger = false,
  variant,
  disabled = false,
  loading = false,
  className,
  tooltipPlacement = 'top',
}) => {
  const resolvedVariant = variant ?? (danger ? 'danger' : 'default')

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (disabled || loading) return
    onClick?.(e)
  }

  const buttonClasses = [
    'erp-table-action-btn',
    `erp-table-action-btn--${resolvedVariant}`,
    disabled ? 'is-disabled' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const buttonElement = (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={label}
    >
      {icon}
    </button>
  )

  return (
    <Tooltip
      title={label}
      placement={tooltipPlacement}
      arrow={{ pointAtCenter: true }}
      mouseEnterDelay={0.06}
    >
      {buttonElement}
    </Tooltip>
  )
}

export interface TableActionBarProps {
  actions?: (TableActionItem | null | undefined | false)[]
  children?: ReactNode
  mode?: 'inline' | 'floating'
  size?: 'small' | 'middle'
  className?: string
  style?: React.CSSProperties
  alwaysVisible?: boolean
}

export const TableActionBar: FC<TableActionBarProps> = ({
  actions,
  children,
  mode = 'inline',
  size,
  className,
  style,
  alwaysVisible = false,
}) => {
  const visibleActions = (actions ?? []).filter(
    (action): action is TableActionItem =>
      typeof action === 'object' && action !== null && !action.hidden,
  )

  const containerClasses = [
    'erp-table-action-bar',
    `erp-table-action-bar--${mode}`,
    size ? `erp-table-action-bar--${size}` : null,
    alwaysVisible ? 'is-visible' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={containerClasses}
      style={style}
      onClick={e => e.stopPropagation()}
      role="toolbar"
      aria-label="Row actions"
    >
      {children}
      {visibleActions.map(action => (
        <TableActionButton
          key={action.key}
          label={action.label}
          icon={action.icon}
          onClick={action.onClick}
          danger={action.danger}
          variant={action.variant}
          disabled={action.disabled}
          loading={action.loading}
        />
      ))}
    </div>
  )
}

export interface CreateTableActionsColumnOptions<T> {
  actions: (record: T) => (TableActionItem | null | undefined | false)[]
  width?: number
  fixed?: 'right' | boolean
  title?: ReactNode
  mode?: 'inline' | 'floating'
}

/**
 * Convenience helper to append a clean, hover-revealed action column to an Ant Design table.
 */
export function createTableActionsColumn<T>(
  options: CreateTableActionsColumnOptions<T>,
): TableColumnType<T> {
  const { actions, width = 180, fixed = 'right', title = '', mode = 'inline' } = options

  return {
    title,
    key: 'actions',
    width,
    fixed: fixed ? 'right' : undefined,
    align: 'right',
    className: 'erp-table-actions-cell',
    render: (_, record) => <TableActionBar mode={mode} actions={actions(record)} />,
  }
}

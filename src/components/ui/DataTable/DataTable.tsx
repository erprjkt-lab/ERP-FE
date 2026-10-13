import { Table } from 'antd'
import type { TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { FC, ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TableActionBar } from '../TableActionBar'
import type { TableActionItem } from '../TableActionBar'

export interface DataTableProps<T extends AnyObject> extends TableProps<T> {
  totalLabel?: string
  /** Fills the parent container's height and scrolls only the table body,
   * keeping the column header and pagination bar fixed on screen. Parent
   * chain (e.g. Card + Card body) must itself be a flex container that
   * gives this table a definite height to fill. */
  fillHeight?: boolean
  /** Custom row hover action items popped over at the end of the hovered row without any extra column */
  rowActions?: (record: T) => (TableActionItem | null | undefined | false)[]
  /** Custom popover render function for the hovered row */
  renderRowActions?: (record: T) => ReactNode
}

export function DataTable<T extends AnyObject>({
  totalLabel = 'records',
  pagination,
  fillHeight = false,
  scroll,
  className,
  rowActions,
  renderRowActions,
  onRow,
  ...props
}: DataTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredState, setHoveredState] = useState<{
    record: T
    top: number
    height: number
  } | null>(null)
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOverPopoverRef = useRef(false)

  const handleRowMouseEnter = useCallback((record: T, tr: HTMLTableRowElement) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    const containerRect = containerRef.current?.getBoundingClientRect() ?? { top: 0, height: 0 }
    const trRect = tr.getBoundingClientRect()
    const top = trRect.top - containerRect.top
    const height = trRect.height || 40

    setHoveredState({
      record,
      top,
      height,
    })
  }, [])

  const handleRowMouseLeave = useCallback(() => {
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isOverPopoverRef.current) {
        setHoveredState(null)
      }
    }, 80)
  }, [])

  const handlePopoverMouseEnter = useCallback(() => {
    isOverPopoverRef.current = true
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }, [])

  const handlePopoverMouseLeave = useCallback(() => {
    isOverPopoverRef.current = false
    setHoveredState(null)
  }, [])

  // Clear popover on table scroll or window resize
  useEffect(() => {
    const container = containerRef.current
    if (!container || (!rowActions && !renderRowActions)) return

    const handleScroll = () => {
      if (!isOverPopoverRef.current) {
        setHoveredState(null)
      }
    }

    const scrollTargets = container.querySelectorAll('.ant-table-body, .ant-table-content')
    scrollTargets.forEach(el => el.addEventListener('scroll', handleScroll, { passive: true }))
    window.addEventListener('resize', handleScroll)

    return () => {
      scrollTargets.forEach(el => el.removeEventListener('scroll', handleScroll))
      window.removeEventListener('resize', handleScroll)
    }
  }, [rowActions, renderRowActions])

  const mergedOnRow = useCallback(
    (record: T, index?: number) => {
      const callerProps = onRow ? onRow(record, index) : {}
      if (!rowActions && !renderRowActions) return callerProps

      return {
        ...callerProps,
        onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
          callerProps.onMouseEnter?.(e)
          handleRowMouseEnter(record, e.currentTarget)
        },
        onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
          callerProps.onMouseLeave?.(e)
          handleRowMouseLeave()
        },
      }
    },
    [onRow, rowActions, renderRowActions, handleRowMouseEnter, handleRowMouseLeave],
  )

  const defaultPagination =
    pagination === false
      ? false
      : {
          showSizeChanger: true,
          showTotal: (total: number, range: [number, number]) =>
            `${range[0]}-${range[1]} of ${total} ${totalLabel}`,
          defaultPageSize: 20,
          pageSizeOptions: [10, 20, 50, 100],
          ...((typeof pagination === 'object' && pagination) || {}),
        }

  const mergedScroll = fillHeight
    ? { x: 'max-content', y: 1, ...scroll }
    : (scroll ?? { x: 'max-content' })

  const hasRowActions = Boolean(rowActions || renderRowActions)

  const currentActions = hoveredState && rowActions ? rowActions(hoveredState.record) : []
  const hasVisibleActions =
    Boolean(renderRowActions) ||
    currentActions.some(a => Boolean(a) && typeof a === 'object' && a !== null && !a.hidden)

  return (
    <div
      ref={containerRef}
      className={[
        'erp-data-table-wrapper',
        fillHeight ? 'erp-data-table-wrapper--fill-height' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        position: 'relative',
        width: '100%',
        height: fillHeight ? '100%' : undefined,
        display: fillHeight ? 'flex' : undefined,
        flexDirection: fillHeight ? 'column' : undefined,
        minHeight: 0,
        flex: fillHeight ? 1 : undefined,
      }}
    >
      <Table<T>
        size="middle"
        scroll={mergedScroll}
        pagination={defaultPagination}
        className={[fillHeight ? 'erp-fill-height-table' : null, className]
          .filter(Boolean)
          .join(' ')}
        onRow={hasRowActions ? mergedOnRow : onRow}
        {...props}
      />

      {hasRowActions && hoveredState && hasVisibleActions && (
        <div
          className="erp-floating-row-action-popover"
          style={{
            position: 'absolute',
            top: hoveredState.top + (hoveredState.height - 40) / 2,
            right: 12,
            zIndex: 25,
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          onClick={e => e.stopPropagation()}
        >
          {renderRowActions ? (
            renderRowActions(hoveredState.record)
          ) : rowActions ? (
            <TableActionBar actions={currentActions} alwaysVisible mode="floating" />
          ) : null}
        </div>
      )}
    </div>
  )
}

// Workaround: Storybook needs a named FC for autodocs
export const DataTableComponent: FC<DataTableProps<AnyObject>> = props => <DataTable {...props} />

import { Table } from 'antd'
import type { TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { FC } from 'react'

export interface DataTableProps<T extends AnyObject> extends TableProps<T> {
  totalLabel?: string
  /** Fills the parent container's height and scrolls only the table body,
   * keeping the column header and pagination bar fixed on screen. Parent
   * chain (e.g. Card + Card body) must itself be a flex container that
   * gives this table a definite height to fill. */
  fillHeight?: boolean
}

export function DataTable<T extends AnyObject>({
  totalLabel = 'records',
  pagination,
  fillHeight = false,
  scroll,
  className,
  ...props
}: DataTableProps<T>) {
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

  return (
    <Table<T>
      size="middle"
      scroll={mergedScroll}
      pagination={defaultPagination}
      className={[fillHeight ? 'erp-fill-height-table' : null, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

// Workaround: Storybook needs a named FC for autodocs
export const DataTableComponent: FC<DataTableProps<AnyObject>> = props => <DataTable {...props} />

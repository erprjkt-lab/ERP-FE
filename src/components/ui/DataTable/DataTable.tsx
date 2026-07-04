import { Table } from 'antd'
import type { TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { FC } from 'react'

export interface DataTableProps<T extends AnyObject> extends TableProps<T> {
  totalLabel?: string
}

export function DataTable<T extends AnyObject>({
  totalLabel = 'records',
  pagination,
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

  return (
    <Table<T>
      size="middle"
      scroll={{ x: 'max-content' }}
      pagination={defaultPagination}
      {...props}
    />
  )
}

// Workaround: Storybook needs a named FC for autodocs
export const DataTableComponent: FC<DataTableProps<AnyObject>> = props => <DataTable {...props} />

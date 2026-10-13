import { Card } from 'antd'
import type { FC } from 'react'
import { useServerPagination } from '@/hooks/useServerPagination'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { ApiUom } from '@/types/api/masters'
import { useUoms } from '../hooks/useUoms'

// Read-only by request: uom-master has no create/update/delete exposed to the
// UI yet, so this just lists what the API returns.
export const UomList: FC = () => {
  const { page, pageSize, paginationProps } = useServerPagination()
  const { data: uoms, meta, isLoading } = useUoms(page, pageSize)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Units of Measure"
        breadcrumbs={[{ label: 'Masters' }, { label: 'Unit' }]}
      />
      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<ApiUom>
          columns={[
            { title: 'Code', dataIndex: 'code', key: 'code', width: 140 },
            { title: 'Name', dataIndex: 'name', key: 'name' },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              width: 100,
              render: status => <StatusBadge status={status === 0 ? 'inactive' : 'active'} />,
            },
          ]}
          dataSource={uoms}
          pagination={paginationProps(meta?.total)}
          rowKey="id"
          loading={isLoading}
          totalLabel="units"
          fillHeight
        />
      </Card>
    </div>
  )
}

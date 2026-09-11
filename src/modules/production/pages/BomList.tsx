import { ApartmentOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, Card, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useFinishedGoods } from '@/modules/masters/hooks/useFinishedGoods'
import type { FinishedGood } from '@/types/masters'

const getColumns = (
  onProcessRoute: (record: FinishedGood) => void,
  onBom: (record: FinishedGood) => void,
): TableColumnsType<FinishedGood> => [
  { title: 'Code', dataIndex: 'code', key: 'code', width: 110 },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Category', dataIndex: 'category', key: 'category', width: 160 },
  { title: 'UOM', dataIndex: 'uom', key: 'uom', width: 90 },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: status => <StatusBadge status={status} />,
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 240,
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="Define the ordered shop-floor operations for this item">
          <Button size="small" icon={<ApartmentOutlined />} onClick={() => onProcessRoute(record)}>
            Process Route
          </Button>
        </Tooltip>
        <Tooltip title="Define the materials consumed per unit of this item">
          <Button size="small" icon={<UnorderedListOutlined />} onClick={() => onBom(record)}>
            Item BOM
          </Button>
        </Tooltip>
      </Space>
    ),
  },
]

export const BomList: FC = () => {
  const navigate = useNavigate()
  const { data: finishedGoods = [], isLoading } = useFinishedGoods()

  const columns = getColumns(
    record => navigate(`/production/bom/${record.id}/process-route`),
    record => navigate(`/production/bom/${record.id}/item-bom`),
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Bill of Materials"
        subtitle="Select a finished good to define its process route or material BOM"
        breadcrumbs={[{ label: 'Production' }, { label: 'BOM' }]}
      />

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<FinishedGood>
          columns={columns}
          dataSource={finishedGoods}
          rowKey="id"
          loading={isLoading}
          totalLabel="finished goods"
          fillHeight
        />
      </Card>
    </div>
  )
}

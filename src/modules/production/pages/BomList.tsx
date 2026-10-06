import { ApartmentOutlined, ExperimentOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Button, Card, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useFinishedGoods } from '@/modules/masters/hooks/useFinishedGoods'
import type { FinishedGood } from '@/types/masters'
import { InspectionParametersDrawer } from '../components/InspectionParametersDrawer'
import { ItemBomDrawer } from '../components/ItemBomDrawer'
import { ItemProcessRouteDrawer } from '../components/ItemProcessRouteDrawer'

const getColumns = (
  onProcessRoute: (record: FinishedGood) => void,
  onBom: (record: FinishedGood) => void,
  onInspectionParameters: (record: FinishedGood) => void,
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
    width: 160,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="Define the ordered shop-floor operations for this item">
          <Button
            type="text"
            size="small"
            icon={<ApartmentOutlined />}
            onClick={() => onProcessRoute(record)}
          />
        </Tooltip>
        <Tooltip title="Define the materials consumed per unit of this item">
          <Button
            type="text"
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() => onBom(record)}
          />
        </Tooltip>
        <Tooltip title="Define the quality control-plan characteristics to check for this item">
          <Button
            type="text"
            size="small"
            icon={<ExperimentOutlined />}
            onClick={() => onInspectionParameters(record)}
          />
        </Tooltip>
      </Space>
    ),
  },
]

export const BomList: FC = () => {
  const { data: finishedGoods = [], isLoading } = useFinishedGoods()
  const [inspectionItemId, setInspectionItemId] = useState<string>()
  const [processRouteItemId, setProcessRouteItemId] = useState<string>()
  const [bomItemId, setBomItemId] = useState<string>()

  const columns = getColumns(
    record => setProcessRouteItemId(record.id),
    record => setBomItemId(record.id),
    record => setInspectionItemId(record.id),
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

      <InspectionParametersDrawer
        open={!!inspectionItemId}
        itemId={inspectionItemId}
        onClose={() => setInspectionItemId(undefined)}
      />

      <ItemProcessRouteDrawer
        open={!!processRouteItemId}
        itemId={processRouteItemId}
        onClose={() => setProcessRouteItemId(undefined)}
      />

      <ItemBomDrawer
        open={!!bomItemId}
        itemId={bomItemId}
        onClose={() => setBomItemId(undefined)}
      />
    </div>
  )
}

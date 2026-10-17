import { ApartmentOutlined, ExperimentOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Card } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useModulePermission } from '@/store/permissionStore'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui'
import { useFinishedGoods } from '@/modules/masters/hooks/useFinishedGoods'
import type { FinishedGood } from '@/types/masters'
import { InspectionParametersDrawer } from '../components/InspectionParametersDrawer'
import { ItemBomDrawer } from '../components/ItemBomDrawer'
import { ItemProcessRouteDrawer } from '../components/ItemProcessRouteDrawer'

const getColumns = (): TableColumnsType<FinishedGood> => [
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
]

interface BomRowActions {
  onProcessRoute: (record: FinishedGood) => void
  onBom: (record: FinishedGood) => void
  onInspectionParameters: (record: FinishedGood) => void
  /** Each button opens that module's drawer, so opening needs `read` on it.
   *  ERP-BE registers no module for ItemProcessRouteController, so the route
   *  drawer follows item-bom — the closest governed owner. */
  can: { bom: boolean; inspection: boolean }
}

const getBomActions = (record: FinishedGood, a: BomRowActions): TableActionItem[] => [
  {
    key: 'route',
    label: 'Process Route',
    icon: <ApartmentOutlined />,
    variant: 'default',
    hidden: !a.can.bom,
    onClick: () => a.onProcessRoute(record),
  },
  {
    key: 'bom',
    label: 'Bill of Materials',
    icon: <UnorderedListOutlined />,
    variant: 'primary',
    hidden: !a.can.bom,
    onClick: () => a.onBom(record),
  },
  {
    key: 'inspection',
    label: 'Inspection Parameters',
    icon: <ExperimentOutlined />,
    variant: 'accent',
    hidden: !a.can.inspection,
    onClick: () => a.onInspectionParameters(record),
  },
]

export const BomList: FC = () => {
  const { canRead: canReadBom } = useModulePermission('item-bom')
  const { canRead: canReadInspection } = useModulePermission('inspection-parameters')
  const { data: finishedGoods = [], isLoading } = useFinishedGoods()
  const [inspectionItemId, setInspectionItemId] = useState<string>()
  const [processRouteItemId, setProcessRouteItemId] = useState<string>()
  const [bomItemId, setBomItemId] = useState<string>()

  const columns = getColumns()

  const rowActions: BomRowActions = {
    onProcessRoute: record => setProcessRouteItemId(record.id),
    onBom: record => setBomItemId(record.id),
    onInspectionParameters: record => setInspectionItemId(record.id),
    can: { bom: canReadBom, inspection: canReadInspection },
  }

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
          rowActions={record => getBomActions(record, rowActions)}
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

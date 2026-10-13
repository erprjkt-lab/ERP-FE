import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui'
import { InspectionParametersDrawer } from '@/modules/production/components/InspectionParametersDrawer'
import { ItemBomDrawer } from '@/modules/production/components/ItemBomDrawer'
import { ItemProcessRouteDrawer } from '@/modules/production/components/ItemProcessRouteDrawer'
import type { FinishedGood } from '@/types/masters'
import { FinishedGoodFormDrawer } from '../components/FinishedGoodFormDrawer'
import { MASTER_STATUS_OPTIONS } from '../constants'
import { useDeleteFinishedGood, useFinishedGoods } from '../hooks/useFinishedGoods'
import { useMastersStore } from '../store/mastersStore'
import { getErrorMessage } from '@/api/client'

interface RowActions {
  onEdit: (record: FinishedGood) => void
  onDelete: (record: FinishedGood) => void
  onProcessRoute: (record: FinishedGood) => void
  onBom: (record: FinishedGood) => void
  onInspectionParameters: (record: FinishedGood) => void
}

const getColumns = (): TableColumnsType<FinishedGood> => [
  { title: 'Code', dataIndex: 'code', key: 'code', width: 110 },
  {
    title: 'Name',
    key: 'name',
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 500 }}>{record.name}</div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{record.category}</div>
      </div>
    ),
  },
  { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
  { title: 'UOM', dataIndex: 'uom', key: 'uom', width: 90 },
  { title: 'Price', dataIndex: 'price', key: 'price', width: 100 },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => <StatusBadge status={status} />,
  },
]

const getFinishedGoodActions = (record: FinishedGood, a: RowActions): TableActionItem[] => [
  {
    key: 'edit',
    label: 'Edit',
    icon: <EditOutlined />,
    variant: 'primary',
    onClick: () => a.onEdit(record),
  },
  {
    key: 'route',
    label: 'Process Route',
    icon: <ApartmentOutlined />,
    variant: 'default',
    onClick: () => a.onProcessRoute(record),
  },
  {
    key: 'bom',
    label: 'Bill of Materials',
    icon: <UnorderedListOutlined />,
    variant: 'primary',
    onClick: () => a.onBom(record),
  },
  {
    key: 'inspection',
    label: 'Inspection Parameters',
    icon: <ExperimentOutlined />,
    variant: 'accent',
    onClick: () => a.onInspectionParameters(record),
  },
  {
    key: 'delete',
    label: 'Delete',
    icon: <DeleteOutlined />,
    variant: 'danger',
    danger: true,
    onClick: () => a.onDelete(record),
  },
]

export const FinishedGoodList: FC = () => {
  const { modal, message } = App.useApp()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
  const [inspectionItemId, setInspectionItemId] = useState<string>()
  const [processRouteItemId, setProcessRouteItemId] = useState<string>()
  const [bomItemId, setBomItemId] = useState<string>()
  const { data: finishedGoods = [], isLoading } = useFinishedGoods()
  const { mutateAsync: deleteFinishedGood } = useDeleteFinishedGood()
  const filters = useMastersStore(s => s.finishedGoodFilters)
  const setFilter = useMastersStore(s => s.setFinishedGoodFilter)
  const resetFilters = useMastersStore(s => s.resetFinishedGoodFilters)

  const handleDelete = (record: FinishedGood) => {
    modal.confirm({
      title: 'Delete this finished good?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteFinishedGood(record.id)
          message.success('Finished good deleted successfully')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns()

  const rowActions: RowActions = {
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onDelete: handleDelete,
    onProcessRoute: record => setProcessRouteItemId(record.id),
    onBom: record => setBomItemId(record.id),
    onInspectionParameters: record => setInspectionItemId(record.id),
  }

  const filtered = finishedGoods.filter(f => {
    if (filters.search && !f.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && f.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Finished Goods"
        subtitle={`${filtered.length} of ${finishedGoods.length} finished goods`}
        breadcrumbs={[{ label: 'Masters', href: '/masters' }, { label: 'Finished Goods' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerState({ mode: 'add' })}
          >
            Add Finished Good
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by name..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={v => setFilter('status', v)}
              allowClear
              style={{ width: '100%' }}
              options={MASTER_STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={resetFilters}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<FinishedGood>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="finished goods"
          fillHeight
          rowActions={record => getFinishedGoodActions(record, rowActions)}
          onRow={record => ({
            onClick: () => setDrawerState({ mode: 'edit', id: record.id }),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <FinishedGoodFormDrawer
        open={!!drawerState}
        finishedGoodId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />

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

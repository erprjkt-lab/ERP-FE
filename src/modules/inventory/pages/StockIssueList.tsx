import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockIssue } from '@/types/inventory'
import { DirectStockIssueFormDrawer } from '../components/DirectStockIssueFormDrawer'
import { useLocations } from '../hooks/useLocations'
import { useAllStockIssues } from '../hooks/useStockIssues'

const getColumns = (): TableColumnsType<StockIssue> => [
  { title: 'Date', dataIndex: 'issueDate', key: 'issueDate', width: 120, render: v => v ?? '—' },
  {
    title: 'Source',
    dataIndex: 'source',
    key: 'source',
    width: 110,
    render: (v: StockIssue['source']) =>
      v === 'DIRECT' ? <Tag color="blue">Direct</Tag> : <Tag color="green">Requisition</Tag>,
  },
  { title: 'Item', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  {
    title: 'Location',
    dataIndex: 'storeLocationName',
    key: 'storeLocationName',
    render: v => v ?? '—',
  },
  {
    title: 'Batch / Heat',
    key: 'batchHeat',
    render: (_, r) => `${r.batchNo ?? '—'} / ${r.heatNo ?? '—'}`,
  },
  { title: 'Qty', dataIndex: 'issuedQty', key: 'issuedQty', align: 'right', width: 90 },
  { title: 'Issued By', dataIndex: 'issuedByName', key: 'issuedByName', render: v => v ?? '—' },
  { title: 'Issued To', dataIndex: 'issuedToName', key: 'issuedToName', render: v => v ?? '—' },
]

export const StockIssueList: FC = () => {
  const [itemId, setItemId] = useState<string | undefined>()
  const [locationId, setLocationId] = useState<string | undefined>()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { data: items, isLoading: loadingItems } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: issues, isLoading } = useAllStockIssues({
    item_id: itemId ? Number(itemId) : undefined,
    location_id: locationId ? Number(locationId) : undefined,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Stock Issue"
        subtitle="Material issued from inventory — against a requisition or direct"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Issue' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            Direct Issue
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              showSearch
              allowClear
              placeholder="Filter by item"
              style={{ width: '100%' }}
              loading={loadingItems}
              value={itemId}
              onChange={setItemId}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
              options={items.map(item => ({
                value: item.id,
                label: `${item.code} — ${item.name}`,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Filter by location"
              style={{ width: '100%' }}
              value={locationId}
              onChange={setLocationId}
              options={locations.map(l => ({ value: l.id, label: l.name }))}
            />
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<StockIssue>
          columns={getColumns()}
          dataSource={issues}
          rowKey="id"
          loading={isLoading}
          totalLabel="issues"
          fillHeight
        />
      </Card>

      <DirectStockIssueFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

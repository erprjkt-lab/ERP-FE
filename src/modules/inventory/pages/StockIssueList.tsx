import { InboxOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Tabs, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { usePagePermission } from '@/hooks/usePagePermission'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import type { TableActionItem } from '@/components/ui'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockIssue, StockRequisition } from '@/types/inventory'
import { DirectStockIssueFormDrawer } from '../components/DirectStockIssueFormDrawer'
import { RequisitionIssueDrawer } from '../components/RequisitionIssueDrawer'
import { useLocations } from '../hooks/useLocations'
import { useAllStockIssues } from '../hooks/useStockIssues'
import { useStockRequisitions } from '../hooks/useStockRequisitions'
import { IssueMaterialList } from './IssueMaterialList'
import { formatDateTime } from '@/utils/date'

const getColumns = (): TableColumnsType<StockIssue> => [
  { title: 'Date', dataIndex: 'issueDate', key: 'issueDate', width: 120, render: formatDateTime },
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

/** The three ways material leaves the store — direct, against an approved stock
 *  requisition, and against a job card — on one page, one tab each. ERP-BE keeps
 *  job-card issues in their own table (material_issues) with no list-all
 *  endpoint, so that tab stays a job-card picker rather than a merged list. */
export const StockIssueList: FC = () => {
  const { canWrite } = usePagePermission()
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
        subtitle="Material issued from inventory — direct, against a requisition, or for a job card"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Issue' }]}
        actions={
          canWrite ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              Direct Issue
            </Button>
          ) : undefined
        }
      />

      <Tabs
        defaultActiveKey="issued"
        style={{ flex: 1, minHeight: 0 }}
        items={[
          {
            key: 'issued',
            label: 'Issued Stock',
            children: (
              <>
                <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
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

                <Card
                  styles={{
                    body: {
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    },
                  }}
                >
                  <DataTable<StockIssue>
                    columns={getColumns()}
                    dataSource={issues}
                    rowKey="id"
                    loading={isLoading}
                    totalLabel="issues"
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'requisition',
            label: 'Issue Against Requisition',
            children: <ApprovedRequisitionsPanel />,
          },
          {
            key: 'job-card',
            label: 'Issue For Job Card',
            children: <IssueMaterialList embedded />,
          },
        ]}
      />

      <DirectStockIssueFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

/** Approved requisitions are the only ones ERP-BE will issue against
 *  (StockIssueService::issue rejects any other status). */
const ApprovedRequisitionsPanel: FC = () => {
  // Issuing against a requisition is still a stock-issue write, and this panel
  // renders under /inventory/stock-issues, so the page permission applies.
  const { canWrite } = usePagePermission()
  const [issueRequisitionId, setIssueRequisitionId] = useState<string>()
  const { data: requisitions = [], isLoading } = useStockRequisitions({ status: 'APPROVED' })

  const columns: TableColumnsType<StockRequisition> = [
    {
      title: 'Requisition No',
      dataIndex: 'requisitionNumber',
      key: 'requisitionNumber',
      width: 150,
    },
    {
      title: 'Date',
      dataIndex: 'requisitionDate',
      key: 'requisitionDate',
      width: 120,
      render: formatDateTime,
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: v => v ?? '—',
    },
    {
      title: 'Pending Lines',
      key: 'pendingLines',
      width: 130,
      align: 'right',
      render: (_, record) => record.items.filter(item => item.pendingQty > 0).length,
    },
  ]

  const rowActions = (record: StockRequisition): TableActionItem[] => [
    {
      key: 'issue',
      label: 'Issue Stock',
      icon: <InboxOutlined />,
      variant: 'primary',
      hidden: !canWrite,
      onClick: () => setIssueRequisitionId(record.id),
    },
  ]

  return (
    <>
      <Card styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}>
        <DataTable<StockRequisition>
          columns={columns}
          dataSource={requisitions}
          rowKey="id"
          loading={isLoading}
          totalLabel="approved requisitions"
          rowActions={rowActions}
          locale={{ emptyText: 'No approved requisition is waiting to be issued.' }}
        />
      </Card>

      <RequisitionIssueDrawer
        open={!!issueRequisitionId}
        requisitionId={issueRequisitionId}
        onClose={() => setIssueRequisitionId(undefined)}
      />
    </>
  )
}

import { DownloadOutlined, EyeOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Row, Select } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { downloadDeliveryChallanPdf } from '@/api/deliveryChallans'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui'
import type { DeliveryChallanItemRow, DeliveryChallanStatus } from '@/types/sales'
import { DeliveryChallanFormDrawer } from '../components/DeliveryChallanFormDrawer'
import { CHALLAN_STATUS_BADGE, CHALLAN_STATUS_LABELS } from '../constants'
import { useCancelDeliveryChallan, useDeliveryChallanItems } from '../hooks/useDeliveryChallans'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(CHALLAN_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface RowActions {
  onView: (record: DeliveryChallanItemRow) => void
  onDownload: (record: DeliveryChallanItemRow) => void
  onCancel: (record: DeliveryChallanItemRow) => void
  downloadingId: string | undefined
  cancellingId: string | undefined
}

const getColumns = (): TableColumnsType<DeliveryChallanItemRow> => [
  { title: 'Challan #', dataIndex: 'challanNumber', key: 'challanNumber', width: 150 },
  { title: 'Date', dataIndex: 'challanDate', key: 'challanDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode', render: v => v ?? '—' },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  {
    title: 'Dispatch Qty',
    dataIndex: 'dispatchQty',
    key: 'dispatchQty',
    width: 110,
    align: 'right',
  },
  { title: 'Billed Qty', dataIndex: 'billedQty', key: 'billedQty', width: 100, align: 'right' },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 80, render: v => v ?? '—' },
  {
    title: 'Line Total',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    width: 120,
    align: 'right',
    render: v => v.toFixed(2),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={CHALLAN_STATUS_BADGE[status as DeliveryChallanStatus]}
        label={CHALLAN_STATUS_LABELS[status as DeliveryChallanStatus]}
      />
    ),
  },
]

const getChallanActions = (record: DeliveryChallanItemRow, a: RowActions): TableActionItem[] => [
  {
    key: 'view',
    label: 'View',
    icon: <EyeOutlined />,
    variant: 'default',
    onClick: () => a.onView(record),
  },
  {
    key: 'download',
    label: 'Download PDF',
    icon: <DownloadOutlined />,
    variant: 'primary',
    loading: a.downloadingId === record.deliveryChallanId,
    onClick: () => a.onDownload(record),
  },
  {
    key: 'cancel',
    label: 'Cancel Challan',
    icon: <StopOutlined />,
    variant: 'danger',
    danger: true,
    disabled: record.status !== 'DISPATCHED',
    loading: a.cancellingId === record.deliveryChallanId,
    onClick: () => a.onCancel(record),
  },
]

export const DeliveryChallanList: FC = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const status = useSalesStatusFilter('challan')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string>()
  const [cancellingId, setCancellingId] = useState<string>()

  const {
    data: challanItems,
    meta,
    isLoading,
    isFetching,
  } = useDeliveryChallanItems({ page, perPage: pageSize, status })
  const { mutateAsync: runCancel } = useCancelDeliveryChallan()

  const handleStatusChange = (value: string | null) => {
    setStatus('challan', value ?? null)
    setPage(1)
  }

  const handleDownload = async (record: DeliveryChallanItemRow) => {
    setDownloadingId(record.deliveryChallanId)
    try {
      await downloadDeliveryChallanPdf(Number(record.deliveryChallanId), record.challanNumber)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setDownloadingId(undefined)
    }
  }

  const handleCancel = (record: DeliveryChallanItemRow) => {
    modal.confirm({
      title: `Cancel ${record.challanNumber}?`,
      content:
        'This reverses the stock dispatched on this challan and restores the pending quantity on its sales order. Only allowed while nothing on it has been billed.',
      okText: 'Cancel Challan',
      okButtonProps: { danger: true },
      onOk: async () => {
        setCancellingId(record.deliveryChallanId)
        try {
          await runCancel(record.deliveryChallanId)
          message.success('Delivery challan cancelled')
        } catch (error) {
          message.error(getErrorMessage(error))
        } finally {
          setCancellingId(undefined)
        }
      },
    })
  }

  const columns = getColumns()

  const rowActions: RowActions = {
    onView: record => navigate(`/sales/delivery-challans/${record.deliveryChallanId}`),
    onDownload: handleDownload,
    onCancel: handleCancel,
    downloadingId,
    cancellingId,
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Delivery Challans"
        subtitle={`${meta?.total ?? 0} delivery challan items`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Delivery Challan' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Delivery Challan
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              value={status}
              onChange={handleStatusChange}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          {status && (
            <Col>
              <Button onClick={() => handleStatusChange(null)}>Clear filter</Button>
            </Col>
          )}
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<DeliveryChallanItemRow>
          columns={columns}
          dataSource={challanItems}
          rowKey="id"
          loading={isLoading || isFetching}
          pagination={{
            current: page,
            pageSize,
            total: meta?.total ?? 0,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            },
          }}
          totalLabel="delivery challan items"
          fillHeight
          rowActions={record => getChallanActions(record, rowActions)}
          onRow={record => ({
            onClick: () => navigate(`/sales/delivery-challans/${record.deliveryChallanId}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <DeliveryChallanFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

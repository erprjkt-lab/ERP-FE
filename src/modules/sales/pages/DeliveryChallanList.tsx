import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { DeliveryChallan } from '@/types/sales'
import { CHALLAN_STATUS_BADGE, CHALLAN_STATUS_LABELS } from '../constants'
import { useDeliveryChallans } from '../hooks/useDeliveryChallans'
import { useSalesStatusFilter, useSalesStore } from '../store/salesStore'

const STATUS_OPTIONS = Object.entries(CHALLAN_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (
  onView: (record: DeliveryChallan) => void,
): TableColumnsType<DeliveryChallan> => [
  { title: 'Challan #', dataIndex: 'challanNumber', key: 'challanNumber', width: 160 },
  { title: 'Date', dataIndex: 'challanDate', key: 'challanDate', width: 120 },
  { title: 'Customer', dataIndex: 'partyName', key: 'partyName', render: v => v ?? '—' },
  {
    title: 'Vehicle',
    dataIndex: 'vehicleNo',
    key: 'vehicleNo',
    width: 120,
    render: v => v || '—',
  },
  {
    title: 'Transporter',
    dataIndex: 'transporterName',
    key: 'transporterName',
    width: 150,
    render: v => v || '—',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: status => (
      <StatusBadge
        status={CHALLAN_STATUS_BADGE[status as DeliveryChallan['status']]}
        label={CHALLAN_STATUS_LABELS[status as DeliveryChallan['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 60,
    render: (_, record) => (
      <Tooltip title="View">
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={e => {
            e.stopPropagation()
            onView(record)
          }}
        />
      </Tooltip>
    ),
  },
]

export const DeliveryChallanList: FC = () => {
  const navigate = useNavigate()
  const status = useSalesStatusFilter('challan')
  const setStatus = useSalesStore(s => s.setStatus)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const {
    data: challans,
    meta,
    isLoading,
    isFetching,
  } = useDeliveryChallans({
    page,
    perPage: pageSize,
    status,
  })

  const handleStatusChange = (value: string | null) => {
    setStatus('challan', value ?? null)
    setPage(1)
  }

  const columns = getColumns(record => navigate(`/sales/delivery-challans/${record.id}`))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Delivery Challans"
        subtitle={`${meta?.total ?? 0} challans`}
        breadcrumbs={[{ label: 'Sales' }, { label: 'Delivery Challan' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/sales/delivery-challans/new')}
          >
            New Challan
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
        <DataTable<DeliveryChallan>
          columns={columns}
          dataSource={challans}
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
          totalLabel="challans"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/sales/delivery-challans/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

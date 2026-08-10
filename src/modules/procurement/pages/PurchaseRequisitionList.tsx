import { DeleteOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { PurchaseRequisition } from '@/types/procurement'
import { REQUISITION_STATUS_BADGE, REQUISITION_STATUS_LABELS } from '../constants'
import {
  useDeletePurchaseRequisition,
  usePurchaseRequisitions,
} from '../hooks/usePurchaseRequisitions'
import { useProcurementFilters, useProcurementStore } from '../store/procurementStore'

const STATUS_OPTIONS = Object.entries(REQUISITION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const getColumns = (
  onView: (record: PurchaseRequisition) => void,
  onDelete: (record: PurchaseRequisition) => void,
): TableColumnsType<PurchaseRequisition> => [
  { title: 'Requisition #', dataIndex: 'requisitionNumber', key: 'requisitionNumber', width: 140 },
  { title: 'Date', dataIndex: 'requisitionDate', key: 'requisitionDate', width: 120 },
  {
    title: 'Department',
    dataIndex: 'departmentName',
    key: 'departmentName',
    render: v => v ?? '—',
  },
  { title: 'Priority', dataIndex: 'priority', key: 'priority' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => (
      <StatusBadge
        status={REQUISITION_STATUS_BADGE[status as PurchaseRequisition['status']]}
        label={REQUISITION_STATUS_LABELS[status as PurchaseRequisition['status']]}
      />
    ),
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 90,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="View">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
        </Tooltip>
        {record.status === 'DRAFT' && (
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            />
          </Tooltip>
        )}
      </Space>
    ),
  },
]

export const PurchaseRequisitionList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: requisitions, isLoading } = usePurchaseRequisitions()
  const { mutateAsync: deleteRequisition } = useDeletePurchaseRequisition()
  const filters = useProcurementFilters('requisition')
  const setFilter = useProcurementStore(s => s.setFilter)
  const resetFilters = useProcurementStore(s => s.resetFilter)

  const handleDelete = (record: PurchaseRequisition) => {
    modal.confirm({
      title: 'Delete this requisition?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRequisition(record.id)
          message.success('Purchase requisition deleted')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const columns = getColumns(
    record => navigate(`/purchase/requisitions/${record.id}`),
    handleDelete,
  )

  const filtered = requisitions.filter(pr => {
    if (
      filters.search &&
      !pr.requisitionNumber.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false
    }
    if (filters.status && pr.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Purchase Requisitions"
        subtitle={`${filtered.length} of ${requisitions.length} requisitions`}
        breadcrumbs={[{ label: 'Purchase', href: '/purchase' }, { label: 'Requisitions' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/purchase/requisitions/new')}
          >
            New Requisition
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by requisition #..."
              value={filters.search}
              onChange={e => setFilter('requisition', 'search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={v => setFilter('requisition', 'status', v)}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={() => resetFilters('requisition')}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<PurchaseRequisition>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="requisitions"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/purchase/requisitions/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

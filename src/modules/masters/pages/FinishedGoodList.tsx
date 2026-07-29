import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { FinishedGood } from '@/types/masters'
import { MASTER_STATUS_OPTIONS } from '../constants'
import { useDeleteFinishedGood, useFinishedGoods } from '../hooks/useFinishedGoods'
import { useMastersStore } from '../store/mastersStore'

const getColumns = (
  onEdit: (record: FinishedGood) => void,
  onDelete: (record: FinishedGood) => void,
): TableColumnsType<FinishedGood> => [
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
  {
    title: 'Actions',
    key: 'actions',
    width: 90,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="Edit">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
        </Tooltip>
        <Tooltip title="Delete">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record)}
          />
        </Tooltip>
      </Space>
    ),
  },
]

export const FinishedGoodList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
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
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const columns = getColumns(
    record => navigate(`/masters/finished-goods/${record.id}/edit`),
    handleDelete,
  )

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
            onClick={() => navigate('/masters/finished-goods/new')}
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
          onRow={record => ({
            onClick: () => navigate(`/masters/finished-goods/${record.id}/edit`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

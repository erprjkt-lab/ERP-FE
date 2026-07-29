import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Supplier } from '@/types/masters'
import { MASTER_STATUS_OPTIONS } from '../constants'
import { useDeleteSupplier, useSuppliers } from '../hooks/useSuppliers'
import { useMastersStore } from '../store/mastersStore'

const getColumns = (
  onView: (record: Supplier) => void,
  onEdit: (record: Supplier) => void,
  onDelete: (record: Supplier) => void,
): TableColumnsType<Supplier> => [
  { title: 'Code', dataIndex: 'code', key: 'code', width: 110 },
  {
    title: 'Name',
    key: 'name',
    render: (_, record) => (
      <div>
        <div style={{ fontWeight: 500 }}>{record.name}</div>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{record.contactPerson}</div>
      </div>
    ),
  },
  { title: 'Mobile', dataIndex: 'mobile', key: 'mobile' },
  { title: 'City', dataIndex: 'cityName', key: 'city' },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => <StatusBadge status={status} />,
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    render: (_, record) => (
      <Space size="small" onClick={e => e.stopPropagation()}>
        <Tooltip title="View">
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
        </Tooltip>
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

export const SupplierList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: suppliers = [], isLoading } = useSuppliers()
  const { mutateAsync: deleteSupplier } = useDeleteSupplier()
  const filters = useMastersStore(s => s.supplierFilters)
  const setFilter = useMastersStore(s => s.setSupplierFilter)
  const resetFilters = useMastersStore(s => s.resetSupplierFilters)

  const handleDelete = (record: Supplier) => {
    modal.confirm({
      title: 'Delete this supplier?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteSupplier(record.id)
          message.success('Supplier deleted successfully')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const columns = getColumns(
    record => navigate(`/masters/suppliers/${record.id}`),
    record => navigate(`/masters/suppliers/${record.id}/edit`),
    handleDelete,
  )

  const filtered = suppliers.filter(s => {
    if (filters.search && !s.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && s.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Suppliers"
        subtitle={`${filtered.length} of ${suppliers.length} suppliers`}
        breadcrumbs={[{ label: 'Masters', href: '/masters' }, { label: 'Suppliers' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/masters/suppliers/new')}
          >
            Add Supplier
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
        <DataTable<Supplier>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="suppliers"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/masters/suppliers/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

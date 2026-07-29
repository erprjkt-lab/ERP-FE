import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Vendor } from '@/types/masters'
import { MASTER_STATUS_OPTIONS, VENDOR_TYPE_OPTIONS } from '../constants'
import { useDeleteVendor, useVendors } from '../hooks/useVendors'
import { useMastersStore } from '../store/mastersStore'

const getColumns = (
  onView: (record: Vendor) => void,
  onEdit: (record: Vendor) => void,
  onDelete: (record: Vendor) => void,
): TableColumnsType<Vendor> => [
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

export const VendorList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: vendors = [], isLoading } = useVendors()
  const { mutateAsync: deleteVendor } = useDeleteVendor()
  const filters = useMastersStore(s => s.vendorFilters)
  const setFilter = useMastersStore(s => s.setVendorFilter)
  const resetFilters = useMastersStore(s => s.resetVendorFilters)

  const handleDelete = (record: Vendor) => {
    modal.confirm({
      title: 'Delete this vendor?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteVendor(record.id)
          message.success('Vendor deleted successfully')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const columns = getColumns(
    record => navigate(`/masters/vendors/${record.id}`),
    record => navigate(`/masters/vendors/${record.id}/edit`),
    handleDelete,
  )

  const filtered = vendors.filter(v => {
    if (filters.search && !v.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && v.status !== filters.status) return false
    if (filters.vendorType && v.vendorType !== filters.vendorType) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Vendors"
        subtitle={`${filtered.length} of ${vendors.length} vendors`}
        breadcrumbs={[{ label: 'Masters', href: '/masters' }, { label: 'Vendors' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/masters/vendors/new')}
          >
            Add Vendor
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
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Type"
              value={filters.vendorType}
              onChange={v => setFilter('vendorType', v)}
              allowClear
              style={{ width: '100%' }}
              options={VENDOR_TYPE_OPTIONS}
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
        <DataTable<Vendor>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="vendors"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/masters/vendors/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

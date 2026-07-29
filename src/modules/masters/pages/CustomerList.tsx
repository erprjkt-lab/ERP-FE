import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Customer } from '@/types/masters'
import { CUSTOMER_TYPE_OPTIONS, MASTER_STATUS_OPTIONS } from '../constants'
import { useDeleteCustomer, useCustomers } from '../hooks/useCustomers'
import { useMastersStore } from '../store/mastersStore'

const getColumns = (
  onView: (record: Customer) => void,
  onEdit: (record: Customer) => void,
  onDelete: (record: Customer) => void,
): TableColumnsType<Customer> => [
  {
    title: 'Code',
    dataIndex: 'code',
    key: 'code',
    width: 110,
  },
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

export const CustomerList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: customers = [], isLoading } = useCustomers()
  const { mutateAsync: deleteCustomer } = useDeleteCustomer()
  const filters = useMastersStore(s => s.customerFilters)
  const setFilter = useMastersStore(s => s.setCustomerFilter)
  const resetFilters = useMastersStore(s => s.resetCustomerFilters)

  const handleDelete = (record: Customer) => {
    modal.confirm({
      title: 'Delete this customer?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCustomer(record.id)
          message.success('Customer deleted successfully')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const columns = getColumns(
    record => navigate(`/masters/customers/${record.id}`),
    record => navigate(`/masters/customers/${record.id}/edit`),
    handleDelete,
  )

  const filtered = customers.filter(c => {
    if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && c.status !== filters.status) return false
    if (filters.customerType && c.customerType !== filters.customerType) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Customers"
        subtitle={`${filtered.length} of ${customers.length} customers`}
        breadcrumbs={[{ label: 'Masters', href: '/masters' }, { label: 'Customers' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/masters/customers/new')}
          >
            Add Customer
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
              value={filters.customerType}
              onChange={v => setFilter('customerType', v)}
              allowClear
              style={{ width: '100%' }}
              options={CUSTOMER_TYPE_OPTIONS}
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
        <DataTable<Customer>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="customers"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/masters/customers/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

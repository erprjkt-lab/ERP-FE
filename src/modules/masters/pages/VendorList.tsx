import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui'
import type { Vendor } from '@/types/masters'
import { VendorFormDrawer } from '../components/VendorFormDrawer'
import { MASTER_STATUS_OPTIONS, VENDOR_TYPE_OPTIONS } from '../constants'
import { useDeleteVendor, useVendors } from '../hooks/useVendors'
import { useMastersStore } from '../store/mastersStore'
import { getErrorMessage } from '@/api/client'

const getColumns = (): TableColumnsType<Vendor> => [
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
]

interface VendorRowActions {
  onView: (record: Vendor) => void
  onEdit: (record: Vendor) => void
  onDelete: (record: Vendor) => void
}

const getVendorActions = (record: Vendor, a: VendorRowActions): TableActionItem[] => [
  {
    key: 'view',
    label: 'View',
    icon: <EyeOutlined />,
    variant: 'default',
    onClick: () => a.onView(record),
  },
  {
    key: 'edit',
    label: 'Edit',
    icon: <EditOutlined />,
    variant: 'primary',
    onClick: () => a.onEdit(record),
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

export const VendorList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
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
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns()

  const rowActions: VendorRowActions = {
    onView: record => navigate(`/masters/vendors/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onDelete: handleDelete,
  }

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
            onClick={() => setDrawerState({ mode: 'add' })}
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
          rowActions={record => getVendorActions(record, rowActions)}
          onRow={record => ({
            onClick: () => navigate(`/masters/vendors/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <VendorFormDrawer
        open={!!drawerState}
        vendorId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />
    </div>
  )
}

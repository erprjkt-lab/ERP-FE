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
import type { Supplier } from '@/types/masters'
import { SupplierFormDrawer } from '../components/SupplierFormDrawer'
import { MASTER_STATUS_OPTIONS } from '../constants'
import { useDeleteSupplier, useSuppliers } from '../hooks/useSuppliers'
import { useMastersStore } from '../store/mastersStore'
import { getErrorMessage } from '@/api/client'

const getColumns = (): TableColumnsType<Supplier> => [
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

interface SupplierRowActions {
  onView: (record: Supplier) => void
  onEdit: (record: Supplier) => void
  onDelete: (record: Supplier) => void
}

const getSupplierActions = (record: Supplier, a: SupplierRowActions): TableActionItem[] => [
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

export const SupplierList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const [drawerState, setDrawerState] = useState<{ mode: 'add' } | { mode: 'edit'; id: string }>()
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
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const columns = getColumns()

  const rowActions: SupplierRowActions = {
    onView: record => navigate(`/masters/suppliers/${record.id}`),
    onEdit: record => setDrawerState({ mode: 'edit', id: record.id }),
    onDelete: handleDelete,
  }

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
            onClick={() => setDrawerState({ mode: 'add' })}
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
          rowActions={record => getSupplierActions(record, rowActions)}
          onRow={record => ({
            onClick: () => navigate(`/masters/suppliers/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <SupplierFormDrawer
        open={!!drawerState}
        supplierId={drawerState?.mode === 'edit' ? drawerState.id : undefined}
        onClose={() => setDrawerState(undefined)}
      />
    </div>
  )
}

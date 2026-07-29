import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { RawMaterial } from '@/types/masters'
import { MASTER_STATUS_OPTIONS } from '../constants'
import { useDeleteRawMaterial, useRawMaterials } from '../hooks/useRawMaterials'
import { useMastersStore } from '../store/mastersStore'

const getColumns = (
  onEdit: (record: RawMaterial) => void,
  onDelete: (record: RawMaterial) => void,
): TableColumnsType<RawMaterial> => [
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
  { title: 'Material Grade', dataIndex: 'materialGrade', key: 'materialGrade' },
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

export const RawMaterialList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { data: rawMaterials = [], isLoading } = useRawMaterials()
  const { mutateAsync: deleteRawMaterial } = useDeleteRawMaterial()
  const filters = useMastersStore(s => s.rawMaterialFilters)
  const setFilter = useMastersStore(s => s.setRawMaterialFilter)
  const resetFilters = useMastersStore(s => s.resetRawMaterialFilters)

  const handleDelete = (record: RawMaterial) => {
    modal.confirm({
      title: 'Delete this raw material?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRawMaterial(record.id)
          message.success('Raw material deleted successfully')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const columns = getColumns(
    record => navigate(`/masters/raw-materials/${record.id}/edit`),
    handleDelete,
  )

  const filtered = rawMaterials.filter(r => {
    if (filters.search && !r.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.status && r.status !== filters.status) return false
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Raw Materials"
        subtitle={`${filtered.length} of ${rawMaterials.length} raw materials`}
        breadcrumbs={[{ label: 'Masters', href: '/masters' }, { label: 'Raw Materials' }]}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/masters/raw-materials/new')}
          >
            Add Raw Material
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
        <DataTable<RawMaterial>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          totalLabel="raw materials"
          fillHeight
          onRow={record => ({
            onClick: () => navigate(`/masters/raw-materials/${record.id}/edit`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

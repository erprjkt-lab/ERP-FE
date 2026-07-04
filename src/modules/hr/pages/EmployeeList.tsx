import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { App, Avatar, Button, Card, Col, Input, Row, Select, Space, Tooltip } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Employee } from '@/types/hr'
import { useHRStore } from '../store/hrStore'
import { MOCK_EMPLOYEES } from '../_mock/employees'

const COLUMNS: TableColumnsType<Employee> = [
  {
    title: 'Employee',
    key: 'employee',
    render: (_, record) => (
      <Space>
        <Avatar src={record.avatar} size={36}>
          {record.firstName[0]}
        </Avatar>
        <div>
          <div style={{ fontWeight: 500 }}>{record.fullName}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>{record.employeeId}</div>
        </div>
      </Space>
    ),
  },
  {
    title: 'Department',
    dataIndex: ['department', 'name'],
    key: 'department',
  },
  {
    title: 'Designation',
    dataIndex: ['designation', 'title'],
    key: 'designation',
  },
  {
    title: 'Type',
    dataIndex: 'employmentType',
    key: 'type',
    render: type => <span style={{ textTransform: 'capitalize' }}>{type.replace('-', ' ')}</span>,
  },
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
    render: (_, _record) => (
      <Space size="small">
        <Tooltip title="View">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {}}
          />
        </Tooltip>
        <Tooltip title="Edit">
          <Button type="text" size="small" icon={<EditOutlined />} />
        </Tooltip>
        <Tooltip title="Delete">
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Tooltip>
      </Space>
    ),
  },
]

export const EmployeeList: FC = () => {
  const navigate = useNavigate()
  App.useApp()
  const { employeeListFilters, setFilter, resetFilters } = useHRStore()

  const filtered = MOCK_EMPLOYEES.filter(e => {
    if (employeeListFilters.search && !e.fullName.toLowerCase().includes(employeeListFilters.search.toLowerCase())) {
      return false
    }
    if (employeeListFilters.status && e.status !== employeeListFilters.status) return false
    if (employeeListFilters.departmentId && e.departmentId !== employeeListFilters.departmentId) {
      return false
    }
    return true
  })

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${filtered.length} of ${MOCK_EMPLOYEES.length} employees`}
        breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Employees' }]}
        actions={
          <>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/hr/employees/new')}>
              Add Employee
            </Button>
          </>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search by name or ID..."
              value={employeeListFilters.search}
              onChange={e => setFilter('search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              value={employeeListFilters.status}
              onChange={v => setFilter('status', v)}
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Pending', value: 'pending' },
              ]}
            />
          </Col>
          <Col>
            <Button onClick={resetFilters}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<Employee>
          columns={COLUMNS}
          dataSource={filtered}
          rowKey="id"
          totalLabel="employees"
          onRow={record => ({
            onClick: () => navigate(`/hr/employees/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

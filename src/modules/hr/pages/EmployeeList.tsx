import {
  DeleteOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  theme as antTheme,
  Tooltip,
} from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Employee } from '@/types/hr'
import { EMPLOYEE_STATUS_OPTIONS } from '../constants'
import { useDeleteEmployee, useEmployees } from '../hooks/useEmployees'
import { useHRStore } from '../store/hrStore'
import { getDepartmentColor } from '../utils/departmentColor'

const getColumns = (
  colorTextDescription: string,
  onView: (record: Employee) => void,
  onEdit: (record: Employee) => void,
  onDelete: (record: Employee) => void,
): TableColumnsType<Employee> => [
  {
    title: 'Employee',
    key: 'employee',
    render: (_, record) => (
      <Space>
        <Avatar
          src={record.avatar}
          size={36}
          style={{ backgroundColor: getDepartmentColor(record.departmentId) }}
        >
          {record.fullName.charAt(0)}
        </Avatar>
        <div>
          <div style={{ fontWeight: 500 }}>{record.fullName}</div>
          <div style={{ fontSize: 12, color: colorTextDescription }}>{record.employeeId}</div>
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
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => <StatusBadge status={status ?? 'active'} />,
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

export const EmployeeList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const { token } = antTheme.useToken()
  const { employeeListFilters, setFilter, resetFilters } = useHRStore()
  const { data: employees = [], isLoading } = useEmployees()
  const { mutateAsync: deleteEmployee } = useDeleteEmployee()

  const handleDelete = (record: Employee) => {
    modal.confirm({
      title: 'Delete this employee?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEmployee(Number(record.id))
          message.success('Employee deleted successfully')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const columns = getColumns(
    token.colorTextDescription,
    record => navigate(`/hr/employees/${record.id}`),
    record => navigate(`/hr/employees/${record.id}/edit`),
    handleDelete,
  )

  const filtered = employees.filter(e => {
    if (
      employeeListFilters.search &&
      !e.fullName.toLowerCase().includes(employeeListFilters.search.toLowerCase())
    ) {
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
        subtitle={`${filtered.length} of ${employees.length} employees`}
        breadcrumbs={[{ label: 'HR', href: '/hr' }, { label: 'Employees' }]}
        actions={
          <>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/hr/employees/new')}
            >
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
              options={EMPLOYEE_STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button onClick={resetFilters}>Clear filters</Button>
          </Col>
        </Row>
      </PageHeader>

      <Card styles={{ body: { padding: 0 } }}>
        <DataTable<Employee>
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
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

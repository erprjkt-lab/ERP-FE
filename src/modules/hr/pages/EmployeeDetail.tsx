import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Descriptions, Row, Space, Tabs, theme as antTheme } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ledgerText } from '@/theme/typography'
import { getBranchLabel } from '../constants'
import { useEmployee } from '../hooks/useEmployees'
import { getDepartmentColor } from '../utils/departmentColor'

export const EmployeeDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = antTheme.useToken()
  const { data: employee, isLoading } = useEmployee(id)

  if (!employee) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/hr/employees')}>
          Back to Employees
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Employee not found.'}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={employee.fullName}
        subtitle={`${employee.employeeId} · ${employee.designation?.title ?? ''}`}
        breadcrumbs={[
          { label: 'HR', href: '/hr' },
          { label: 'Employees', href: '/hr/employees' },
          { label: employee.fullName },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/hr/employees')}>
              Back
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/hr/employees/${id}/edit`)}
            >
              Edit
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" align="center" style={{ width: '100%', padding: '16px 0' }}>
              <Avatar
                size={96}
                style={{ fontSize: 36, backgroundColor: getDepartmentColor(employee.departmentId) }}
              >
                {employee.fullName.charAt(0)}
              </Avatar>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{employee.fullName}</div>
                <div style={{ color: token.colorTextDescription, marginTop: 4 }}>
                  {employee.email}
                </div>
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={employee.status ?? 'active'} />
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card>
            <Tabs
              items={[
                {
                  key: 'overview',
                  label: 'Overview',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Employee ID">
                        {employee.employeeId}
                      </Descriptions.Item>
                      <Descriptions.Item label="Username">{employee.username}</Descriptions.Item>
                      <Descriptions.Item label="Employment Type" span={1}>
                        <span style={{ textTransform: 'capitalize' }}>
                          {employee.employmentType ?? '—'}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Role">{employee.role ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="Department">
                        {employee.department?.name ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Designation">
                        {employee.designation?.title ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Shift">
                        {employee.shift?.name ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Branch">
                        {getBranchLabel(employee.branch) ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Join Date">
                        {employee.joinDate ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Date of Birth">
                        {employee.dateOfBirth ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Location">
                        {employee.location ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phone">{employee.phone}</Descriptions.Item>
                      <Descriptions.Item label="Gender" style={{ textTransform: 'capitalize' }}>
                        {employee.gender ?? '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'payroll',
                  label: 'Payroll',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Monthly Salary">
                        <span style={ledgerText}>
                          ₹{(employee.salary ?? 0).toLocaleString('en-IN')}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Currency">
                        {employee.currency ?? 'INR'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

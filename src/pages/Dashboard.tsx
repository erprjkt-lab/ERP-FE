import { CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons'
import { Card, Col, Row, Typography } from 'antd'
import type { FC } from 'react'
import { KPICard } from '@/components/ui/KPICard'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MOCK_EMPLOYEES } from '@/modules/hr/_mock/employees'

const activeCount = MOCK_EMPLOYEES.filter(e => e.status === 'active').length

export const Dashboard: FC = () => {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Admin"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Total Employees"
            value={MOCK_EMPLOYEES.length}
            prefix={<TeamOutlined />}
            trend={{ value: 12 }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Monthly Payroll"
            value={MOCK_EMPLOYEES.reduce((sum, e) => sum + e.salary, 0)}
            prefix={<DollarOutlined />}
            formatter={v => `₹${Number(v).toLocaleString('en-IN')}`}
            trend={{ value: 3.2 }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Pending Leaves"
            value={14}
            prefix={<ClockCircleOutlined />}
            color="#fa8c16"
            trend={{ value: -5 }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Active Employees"
            value={activeCount}
            prefix={<CheckCircleOutlined />}
            color="#52c41a"
            trend={{ value: 2 }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Recent Employees">
            {MOCK_EMPLOYEES.slice(0, 5).map(e => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div>
                  <Typography.Text strong>{e.fullName}</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    {e.department?.name} · {e.designation?.title}
                  </Typography.Text>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Department Overview">
            {[
              { name: 'Engineering', count: 45, pct: 45 },
              { name: 'HR', count: 12, pct: 12 },
              { name: 'Finance', count: 18, pct: 18 },
              { name: 'Operations', count: 30, pct: 30 },
              { name: 'Sales', count: 25, pct: 25 },
            ].map(dept => (
              <div key={dept.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Typography.Text>{dept.name}</Typography.Text>
                  <Typography.Text type="secondary">{dept.count} employees</Typography.Text>
                </div>
                <div
                  style={{
                    height: 6,
                    background: '#f0f0f0',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(dept.count / 130) * 100}%`,
                      height: '100%',
                      background: '#1677ff',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

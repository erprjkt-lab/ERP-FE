import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Typography, theme as antTheme } from 'antd'
import type { FC } from 'react'
import { KPICard } from '@/components/ui/KPICard'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MOCK_DEPARTMENTS, MOCK_EMPLOYEES } from '@/modules/hr/_mock/employees'
import { getDepartmentColor } from '@/modules/hr/utils/departmentColor'
import { ledgerText } from '@/theme/typography'

const activeCount = MOCK_EMPLOYEES.filter(e => e.status === 'active').length
const DEPARTMENTS_BY_HEADCOUNT = [...MOCK_DEPARTMENTS].sort((a, b) => b.headCount - a.headCount)
const MAX_HEADCOUNT = DEPARTMENTS_BY_HEADCOUNT[0].headCount

export const Dashboard: FC = () => {
  const { token } = antTheme.useToken()

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back, Admin" />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Total Employees"
            value={MOCK_EMPLOYEES.length}
            prefix={<TeamOutlined />}
            trend={{ value: 12 }}
            tone="dark"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Monthly Payroll"
            value={MOCK_EMPLOYEES.reduce((sum, e) => sum + (e.salary ?? 0), 0)}
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
            color={token.colorWarning}
            trend={{ value: -5 }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Active Employees"
            value={activeCount}
            prefix={<CheckCircleOutlined />}
            trend={{ value: 2 }}
            tone="accent"
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
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <div>
                  <Typography.Text strong>{e.fullName}</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    {e.department?.name} · {e.designation?.title}
                  </Typography.Text>
                </div>
                <StatusBadge status={e.status ?? 'active'} />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Department Overview">
            {DEPARTMENTS_BY_HEADCOUNT.map(dept => (
              <div key={dept.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Typography.Text>{dept.name}</Typography.Text>
                  <Typography.Text type="secondary" style={ledgerText}>
                    {dept.headCount} employees
                  </Typography.Text>
                </div>
                <div
                  style={{
                    height: 6,
                    background: token.colorFillSecondary,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(dept.headCount / MAX_HEADCOUNT) * 100}%`,
                      height: '100%',
                      background: getDepartmentColor(dept.id),
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

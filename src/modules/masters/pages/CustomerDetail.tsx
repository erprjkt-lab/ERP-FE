import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Descriptions, Row, Space, Tabs, theme as antTheme } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { tabularNums } from '@/theme/typography'
import { useCustomer } from '../hooks/useCustomers'

export const CustomerDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = antTheme.useToken()
  const { data: customer, isLoading } = useCustomer(id)

  if (!customer) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/masters/customers')}>
          Back to Customers
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Customer not found.'}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.code}
        breadcrumbs={[
          { label: 'Masters', href: '/masters' },
          { label: 'Customers', href: '/masters/customers' },
          { label: customer.name },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/masters/customers')}>
              Back
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/masters/customers/${id}/edit`)}
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
              <Avatar size={96} style={{ fontSize: 36 }}>
                {customer.name.charAt(0)}
              </Avatar>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{customer.name}</div>
                <div style={{ color: token.colorTextDescription, marginTop: 4 }}>
                  {customer.email}
                </div>
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={customer.status} />
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
                  key: 'basic',
                  label: 'Basic Info',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Customer Code">{customer.code}</Descriptions.Item>
                      <Descriptions.Item label="Type" style={{ textTransform: 'capitalize' }}>
                        {customer.customerType ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Contact Person">
                        {customer.contactPerson}
                      </Descriptions.Item>
                      <Descriptions.Item label="Mobile">{customer.mobile}</Descriptions.Item>
                      <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>
                      <Descriptions.Item label="Website">
                        {customer.website ?? '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'address',
                  label: 'Address',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Address" span={2}>
                        {customer.address}
                      </Descriptions.Item>
                      <Descriptions.Item label="City">{customer.cityName ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="State">
                        {customer.stateName ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Country">
                        {customer.countryName ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Pincode">{customer.pincode}</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'tax',
                  label: 'Tax & Compliance',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="GST Number">
                        {customer.gstNumber ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="PAN Number">
                        {customer.panNumber ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="GST Type" style={{ textTransform: 'capitalize' }}>
                        {customer.gstType ?? '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'financial',
                  label: 'Financial Terms',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Credit Limit">
                        <span style={tabularNums}>
                          ₹{customer.creditLimit.toLocaleString('en-IN')}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Credit Days">
                        {customer.creditDays}
                      </Descriptions.Item>
                      <Descriptions.Item label="Opening Balance">
                        <span style={tabularNums}>
                          ₹{customer.openingBalance.toLocaleString('en-IN')}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Terms">
                        {customer.paymentTerms ?? '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'banking',
                  label: 'Banking',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Bank Name">
                        {customer.bankName ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Branch">
                        {customer.bankBranch ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Account Holder">
                        {customer.accountHolder ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Account Number">
                        {customer.accountNumber ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="IFSC Code">
                        {customer.ifscCode ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="UPI ID">{customer.upiId ?? '—'}</Descriptions.Item>
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

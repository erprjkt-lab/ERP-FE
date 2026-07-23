import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Descriptions, Row, Space, Tabs, theme as antTheme } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useSupplier } from '../hooks/useSuppliers'

export const SupplierDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = antTheme.useToken()
  const { data: supplier, isLoading } = useSupplier(id)

  if (!supplier) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/masters/suppliers')}>
          Back to Suppliers
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Supplier not found.'}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={supplier.name}
        subtitle={supplier.code}
        breadcrumbs={[
          { label: 'Masters', href: '/masters' },
          { label: 'Suppliers', href: '/masters/suppliers' },
          { label: supplier.name },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/masters/suppliers')}>
              Back
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/masters/suppliers/${id}/edit`)}
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
                {supplier.name.charAt(0)}
              </Avatar>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{supplier.name}</div>
                <div style={{ color: token.colorTextDescription, marginTop: 4 }}>
                  {supplier.email}
                </div>
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={supplier.status} />
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
                      <Descriptions.Item label="Supplier Code">{supplier.code}</Descriptions.Item>
                      <Descriptions.Item label="Contact Person">
                        {supplier.contactPerson}
                      </Descriptions.Item>
                      <Descriptions.Item label="Mobile">{supplier.mobile}</Descriptions.Item>
                      <Descriptions.Item label="Email">{supplier.email}</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'address',
                  label: 'Address',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="Address" span={2}>
                        {supplier.address}
                      </Descriptions.Item>
                      <Descriptions.Item label="City">
                        {supplier.city?.name ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="State">
                        {supplier.state?.name ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Country">
                        {supplier.country?.name ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Pincode">{supplier.pincode}</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'tax',
                  label: 'Tax & Terms',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="GST Number">
                        {supplier.gstNumber ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="PAN Number">
                        {supplier.panNumber ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Terms">
                        {supplier.paymentTerms ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Credit Days">
                        {supplier.creditDays}
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
                        {supplier.bankName ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Account Number">
                        {supplier.accountNumber ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="IFSC Code">
                        {supplier.ifscCode ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Remarks" span={2}>
                        {supplier.remarks ?? '—'}
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

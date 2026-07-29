import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Descriptions, Row, Space, Tabs, theme as antTheme } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useVendor } from '../hooks/useVendors'

export const VendorDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = antTheme.useToken()
  const { data: vendor, isLoading } = useVendor(id)

  if (!vendor) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/masters/vendors')}>
          Back to Vendors
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Vendor not found.'}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={vendor.name}
        subtitle={vendor.code}
        breadcrumbs={[
          { label: 'Masters', href: '/masters' },
          { label: 'Vendors', href: '/masters/vendors' },
          { label: vendor.name },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/masters/vendors')}>
              Back
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/masters/vendors/${id}/edit`)}
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
                {vendor.name.charAt(0)}
              </Avatar>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{vendor.name}</div>
                <div style={{ color: token.colorTextDescription, marginTop: 4 }}>
                  {vendor.email}
                </div>
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={vendor.status} />
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
                      <Descriptions.Item label="Vendor Code">{vendor.code}</Descriptions.Item>
                      <Descriptions.Item
                        label="Vendor Type"
                        style={{ textTransform: 'capitalize' }}
                      >
                        {vendor.vendorType ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Contact Person">
                        {vendor.contactPerson}
                      </Descriptions.Item>
                      <Descriptions.Item label="Mobile">{vendor.mobile}</Descriptions.Item>
                      <Descriptions.Item label="Email">{vendor.email}</Descriptions.Item>
                      <Descriptions.Item label="Service Category">
                        {vendor.serviceCategory ?? '—'}
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
                        {vendor.address}
                      </Descriptions.Item>
                      <Descriptions.Item label="City">{vendor.cityName ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="State">{vendor.stateName ?? '—'}</Descriptions.Item>
                      <Descriptions.Item label="Country">
                        {vendor.countryName ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Pincode">{vendor.pincode}</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'tax',
                  label: 'Tax',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="GST Number">
                        {vendor.gstNumber ?? '—'}
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
                        {vendor.bankName ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Account Number">
                        {vendor.accountNumber ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="IFSC Code">
                        {vendor.ifscCode ?? '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Remarks" span={2}>
                        {vendor.remarks ?? '—'}
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

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Space, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { SalesEnquiryItem } from '@/types/sales'
import {
  ENQUIRY_ITEM_STATUS_BADGE,
  ENQUIRY_ITEM_STATUS_LABELS,
  ENQUIRY_STATUS_BADGE,
  ENQUIRY_STATUS_LABELS,
  FEASIBLE_STATUS_BADGE,
  FEASIBLE_STATUS_LABELS,
} from '../constants'
import {
  useCloseSalesEnquiry,
  useDeleteSalesEnquiry,
  useSalesEnquiry,
} from '../hooks/useSalesEnquiries'

const ITEM_COLUMNS: TableColumnsType<SalesEnquiryItem> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, r) => (r.itemCode ? `${r.itemCode} — ${r.itemName}` : (r.itemName ?? r.itemId)),
  },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 90 },
  { title: 'UOM', dataIndex: 'uomName', key: 'uomName', width: 90, render: v => v ?? '—' },
  {
    title: 'Annual Volume',
    dataIndex: 'annualVolume',
    key: 'annualVolume',
    width: 130,
    render: v => v ?? '—',
  },
  {
    title: 'Drawing No',
    dataIndex: 'drawingNo',
    key: 'drawingNo',
    width: 120,
    render: v => v || '—',
  },
  {
    title: 'Drawing Received',
    dataIndex: 'drawingReceived',
    key: 'drawingReceived',
    width: 140,
    render: (v: boolean) => (v ? 'Yes' : 'No'),
  },
  {
    title: 'Feasibility',
    dataIndex: 'feasibleStatus',
    key: 'feasibleStatus',
    width: 130,
    render: value => (
      <StatusBadge
        status={FEASIBLE_STATUS_BADGE[value as SalesEnquiryItem['feasibleStatus']]}
        label={FEASIBLE_STATUS_LABELS[value as SalesEnquiryItem['feasibleStatus']]}
      />
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 110,
    render: value => (
      <StatusBadge
        status={ENQUIRY_ITEM_STATUS_BADGE[value as SalesEnquiryItem['status']]}
        label={ENQUIRY_ITEM_STATUS_LABELS[value as SalesEnquiryItem['status']]}
      />
    ),
  },
]

export const SalesEnquiryDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: enquiry, isLoading } = useSalesEnquiry(id)
  const { mutateAsync: closeEnquiry, isPending: closing } = useCloseSalesEnquiry()
  const { mutateAsync: removeEnquiry, isPending: deleting } = useDeleteSalesEnquiry()

  if (!enquiry) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/enquiries')}>
          Back to Sales Enquiries
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Sales enquiry not found.'}</p>
      </div>
    )
  }

  const isClosed = enquiry.status === 'CLOSED'
  const isOpen = enquiry.status === 'OPEN'

  const handleClose = () => {
    modal.confirm({
      title: 'Close this enquiry?',
      content: 'A closed enquiry can no longer be edited or quoted against.',
      okText: 'Close Enquiry',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await closeEnquiry(enquiry.id)
          message.success('Sales enquiry closed')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const handleDelete = () => {
    modal.confirm({
      title: `Delete ${enquiry.enquiryNumber}?`,
      content: 'This permanently removes the enquiry and its items.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeEnquiry(enquiry.id)
          message.success('Sales enquiry deleted')
          navigate('/sales/enquiries')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  return (
    <div>
      <PageHeader
        title={enquiry.enquiryNumber}
        subtitle={ENQUIRY_STATUS_LABELS[enquiry.status]}
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Sales Enquiry', href: '/sales/enquiries' },
          { label: enquiry.enquiryNumber },
        ]}
        actions={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/enquiries')}>
              Back
            </Button>
            {/* The backend only allows edits while the enquiry is still OPEN. */}
            <Button
              icon={<EditOutlined />}
              disabled={!isOpen}
              onClick={() => navigate(`/sales/enquiries/${enquiry.id}/edit`)}
            >
              Edit
            </Button>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              disabled={isClosed}
              onClick={() => navigate(`/sales/quotations/new?enquiryId=${enquiry.id}`)}
            >
              Create Quotation
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              disabled={isClosed}
              loading={closing}
              onClick={handleClose}
            >
              Close
            </Button>
            {/* Backend only permits deletion while the enquiry is still open. */}
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={!isOpen}
              loading={deleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Descriptions column={3} size="small" bordered>
              <Descriptions.Item label="Status">
                <StatusBadge
                  status={ENQUIRY_STATUS_BADGE[enquiry.status]}
                  label={ENQUIRY_STATUS_LABELS[enquiry.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Enquiry Date">{enquiry.enquiryDate}</Descriptions.Item>
              <Descriptions.Item label="Customer">
                {enquiry.partyName ?? enquiry.partyId}
              </Descriptions.Item>
              <Descriptions.Item label="Ref By">{enquiry.refBy || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ref No">{enquiry.refNo || '—'}</Descriptions.Item>
              <Descriptions.Item label="Created By">{enquiry.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Remarks" span={3}>
                {enquiry.remarks || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title={
              <Typography.Title level={5} style={{ margin: 0 }}>
                Items
              </Typography.Title>
            }
          >
            <DataTable<SalesEnquiryItem>
              columns={ITEM_COLUMNS}
              dataSource={enquiry.items}
              rowKey="id"
              pagination={false}
              size="small"
              totalLabel="items"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Row, Select, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useServerPagination } from '@/hooks/useServerPagination'
import type { ComplaintStatus, CustomerComplaint } from '@/types/quality'
import { ComplaintResolutionDrawer } from '../components/ComplaintResolutionDrawer'
import { CustomerComplaintFormDrawer } from '../components/CustomerComplaintFormDrawer'
import {
  COMPLAINT_STATUS_BADGE,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_STATUS_OPTIONS,
} from '../constants'
import {
  STATUS_TO_API,
  useCloseCustomerComplaint,
  useCustomerComplaints,
  useDeleteCustomerComplaint,
  useStartComplaintReview,
} from '../hooks/useCustomerComplaints'

export const CustomerComplaintList: FC = () => {
  const navigate = useNavigate()
  const { modal, message } = App.useApp()
  const [status, setStatus] = useState<ComplaintStatus>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerComplaint>()
  const [resolving, setResolving] = useState<CustomerComplaint>()
  const { page, pageSize, paginationProps } = useServerPagination()

  // Status is filtered by ERP-BE (CustomerComplaintController reads it off the
  // request), so there is nothing to narrow here afterwards.
  const {
    data: complaints,
    meta,
    isLoading,
  } = useCustomerComplaints({
    status: status ? STATUS_TO_API[status] : null,
    page,
    perPage: pageSize,
  })
  const { mutateAsync: deleteComplaint } = useDeleteCustomerComplaint()
  const { mutateAsync: startReview } = useStartComplaintReview()
  const { mutateAsync: closeComplaint } = useCloseCustomerComplaint()

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      message.success(success)
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const confirmClose = (record: CustomerComplaint) =>
    modal.confirm({
      title: `Close ${record.complaintNumber}?`,
      content: 'A closed complaint can no longer be edited or deleted.',
      okText: 'Close complaint',
      onOk: () => run(() => closeComplaint(record.id), 'Complaint closed'),
    })

  const handleDelete = (record: CustomerComplaint) =>
    modal.confirm({
      title: `Delete ${record.complaintNumber}?`,
      content: record.stockMovementId
        ? `Deleting this also reverses the ${record.returnedQty ?? 0} unit(s) credited back into ${record.returnLocationName ?? 'stock'}.`
        : 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteComplaint(record.id)
          message.success('Complaint deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })

  const columns: TableColumnsType<CustomerComplaint> = [
    { title: 'Complaint #', dataIndex: 'complaintNumber', key: 'complaintNumber', width: 150 },
    { title: 'Date', dataIndex: 'complaintDate', key: 'complaintDate', width: 110 },
    { title: 'Customer', dataIndex: 'partyName', key: 'partyName' },
    { title: 'Item', dataIndex: 'itemName', key: 'itemName' },
    {
      title: 'Returned',
      key: 'productReturned',
      width: 110,
      render: (_, record) =>
        record.productReturned ? (
          <Tag color="orange">{record.returnedQty ?? 0}</Tag>
        ) : (
          <span>—</span>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: value => (
        <StatusBadge
          status={COMPLAINT_STATUS_BADGE[value as ComplaintStatus]}
          label={COMPLAINT_STATUS_LABELS[value as ComplaintStatus]}
        />
      ),
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Customer Complaints"
        subtitle={`${meta?.total ?? complaints.length} complaints`}
        breadcrumbs={[{ label: 'Quality' }, { label: 'Customer Complaints' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            Record Complaint
          </Button>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="Status"
              value={status}
              onChange={value => setStatus(value)}
              allowClear
              style={{ width: '100%' }}
              options={COMPLAINT_STATUS_OPTIONS}
            />
          </Col>
        </Row>
      </Card>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<CustomerComplaint>
          columns={columns}
          dataSource={complaints}
          rowKey="id"
          loading={isLoading}
          totalLabel="complaints"
          pagination={paginationProps(meta?.total)}
          fillHeight
          // Same actions, and the same status gating, as the detail page —
          // mirroring ERP-BE's lifecycle guards so nothing is offered that the
          // server would refuse.
          rowActions={record => [
            {
              key: 'view',
              label: 'View',
              icon: <EyeOutlined />,
              variant: 'primary',
              onClick: () => navigate(`/quality/customer-complaints/${record.id}`),
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: <EditOutlined />,
              hidden: record.status === 'closed',
              onClick: () => setEditing(record),
            },
            {
              key: 'start-review',
              label: 'Start Review',
              icon: <FileTextOutlined />,
              hidden: record.status !== 'open',
              onClick: () => run(() => startReview(record.id), 'Review started'),
            },
            {
              key: 'resolve',
              label: 'Record Resolution',
              icon: <PlusOutlined />,
              hidden: record.status !== 'open' && record.status !== 'in_review',
              onClick: () => setResolving(record),
            },
            {
              key: 'close',
              label: 'Close',
              icon: <CheckCircleOutlined />,
              hidden: record.status !== 'resolved',
              onClick: () => confirmClose(record),
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: <DeleteOutlined />,
              danger: true,
              variant: 'danger',
              // ERP-BE refuses to delete a closed complaint.
              hidden: record.status === 'closed',
              onClick: () => handleDelete(record),
            },
          ]}
          onRow={record => ({
            onClick: () => navigate(`/quality/customer-complaints/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <CustomerComplaintFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <CustomerComplaintFormDrawer
        open={!!editing}
        complaint={editing}
        onClose={() => setEditing(undefined)}
      />
      {resolving && (
        <ComplaintResolutionDrawer
          open
          complaintId={resolving.id}
          complaintNumber={resolving.complaintNumber}
          onClose={() => setResolving(undefined)}
        />
      )}
    </div>
  )
}

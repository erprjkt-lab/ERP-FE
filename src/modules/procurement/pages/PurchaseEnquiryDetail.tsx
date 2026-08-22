import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DiffOutlined,
  FileTextOutlined,
  PlusOutlined,
  SendOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Select, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useSuppliers } from '@/modules/masters/hooks/useSuppliers'
import type { PurchaseEnquiryItem, PurchaseEnquirySupplier } from '@/types/procurement'
import {
  ENQUIRY_STATUS_BADGE,
  ENQUIRY_STATUS_LABELS,
  SUPPLIER_STATUS_BADGE,
  SUPPLIER_STATUS_LABELS,
} from '../constants'
import {
  useAddSupplierToEnquiry,
  usePurchaseEnquiry,
  useRemoveSupplierFromEnquiry,
  useSendPurchaseEnquiry,
} from '../hooks/usePurchaseEnquiries'
import { useCreatePurchaseOrderFromEnquiry, usePurchaseOrders } from '../hooks/usePurchaseOrders'

export const PurchaseEnquiryDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { data: enquiry, isLoading } = usePurchaseEnquiry(id)
  const { data: suppliers = [] } = useSuppliers()
  const { data: purchaseOrders } = usePurchaseOrders()
  const { mutateAsync: sendEnquiry, isPending: sending } = useSendPurchaseEnquiry()
  const { mutateAsync: addSupplier, isPending: addingSupplier } = useAddSupplierToEnquiry()
  const { mutateAsync: removeSupplier } = useRemoveSupplierFromEnquiry()
  const { mutateAsync: createPO, isPending: creatingPO } = useCreatePurchaseOrderFromEnquiry()

  const [addSupplierOpen, setAddSupplierOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>()

  if (!enquiry) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/enquiries')}>
          Back to Enquiries
        </Button>
        <p style={{ marginTop: 24 }}>{isLoading ? 'Loading…' : 'Purchase enquiry not found.'}</p>
      </div>
    )
  }

  const linkedOrder = purchaseOrders.find(po => po.purchaseEnquiryId === enquiry.id)

  const handleSend = async () => {
    try {
      await sendEnquiry(enquiry.id)
      message.success('Purchase enquiry sent to suppliers')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleAddSupplier = async () => {
    if (!selectedSupplierId) return
    const supplier = suppliers.find(s => s.id === selectedSupplierId)
    try {
      await addSupplier({
        enquiryId: enquiry.id,
        supplier: {
          supplierId: selectedSupplierId,
          supplierCode: supplier?.code,
          supplierName: supplier?.name,
        },
      })
      message.success('Supplier added')
      setAddSupplierOpen(false)
      setSelectedSupplierId(undefined)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleRemoveSupplier = (peSupplierId: string) => {
    modal.confirm({
      title: 'Remove this supplier from the enquiry?',
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await removeSupplier({ enquiryId: enquiry.id, peSupplierId })
          message.success('Supplier removed')
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Something went wrong')
        }
      },
    })
  }

  const handleCreatePO = async () => {
    try {
      const po = await createPO({ enquiryId: enquiry.id })
      message.success('Purchase order created')
      navigate(`/purchase/orders/${po.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const alreadyAddedSupplierIds = new Set(enquiry.suppliers.map(sup => sup.supplierId))
  const availableSupplierOptions = suppliers
    .filter(s => !alreadyAddedSupplierIds.has(s.id))
    .map(s => ({ label: `${s.code} — ${s.name}`, value: s.id }))

  const itemColumns = [
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, r: PurchaseEnquiryItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.itemName ?? r.itemId}</div>
          {r.sourcePrNumber && (
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>from {r.sourcePrNumber}</div>
          )}
        </div>
      ),
    },
    { title: 'Required Qty', dataIndex: 'requiredQty', key: 'requiredQty' },
    { title: 'UOM', dataIndex: 'uomName', key: 'uomName' },
    {
      title: 'Required Date',
      dataIndex: 'requiredDate',
      key: 'requiredDate',
      render: (v: string) => v ?? '—',
    },
  ]

  const supplierColumns = [
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_: unknown, r: PurchaseEnquirySupplier) => r.supplierName ?? r.supplierId,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, r: PurchaseEnquirySupplier) => (
        <StatusBadge
          status={SUPPLIER_STATUS_BADGE[r.supplierStatus]}
          label={SUPPLIER_STATUS_LABELS[r.supplierStatus]}
        />
      ),
    },
    { title: 'Sent At', dataIndex: 'sentAt', key: 'sentAt', render: (v: string) => v ?? '—' },
    {
      title: 'Responded At',
      dataIndex: 'responseReceivedAt',
      key: 'responseReceivedAt',
      render: (v: string) => v ?? '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, r: PurchaseEnquirySupplier) => (
        <Space size="small">
          {enquiry.status !== 'DRAFT' && (
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => navigate(`/purchase/enquiries/${enquiry.id}/quotations/${r.id}`)}
            >
              {r.supplierStatus === 'RESPONDED' ||
              r.supplierStatus === 'SELECTED' ||
              r.supplierStatus === 'NOT_SELECTED'
                ? 'View / Edit Quotation'
                : 'Record Quotation'}
            </Button>
          )}
          {enquiry.status === 'DRAFT' && (
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveSupplier(r.id)}
            />
          )}
        </Space>
      ),
    },
  ]

  const canCompare = enquiry.status !== 'DRAFT' && enquiry.status !== 'SENT'

  return (
    <div>
      <PageHeader
        title={enquiry.enquiryNumber}
        subtitle={ENQUIRY_STATUS_LABELS[enquiry.status]}
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'Enquiries', href: '/purchase/enquiries' },
          { label: enquiry.enquiryNumber },
        ]}
        actions={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/enquiries')}>
              Back
            </Button>
            {enquiry.status === 'DRAFT' && (
              <Button type="primary" icon={<SendOutlined />} loading={sending} onClick={handleSend}>
                Send Enquiry
              </Button>
            )}
            {canCompare && (
              <Button
                icon={<DiffOutlined />}
                onClick={() => navigate(`/purchase/enquiries/${enquiry.id}/compare`)}
              >
                Compare Quotations
              </Button>
            )}
            {enquiry.status === 'SUPPLIER_SELECTED' && (
              <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                loading={creatingPO}
                onClick={handleCreatePO}
              >
                Create Purchase Order
              </Button>
            )}
            {linkedOrder && (
              <Button onClick={() => navigate(`/purchase/orders/${linkedOrder.id}`)}>
                View Purchase Order
              </Button>
            )}
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
              <Descriptions.Item label="Due Date">
                {enquiry.enquiryDueDate ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">{enquiry.priority}</Descriptions.Item>
              <Descriptions.Item label="Created By">{enquiry.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Remarks">{enquiry.remarks ?? '—'}</Descriptions.Item>
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
            <DataTable
              columns={itemColumns}
              dataSource={enquiry.items}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card
            title={
              <Typography.Title level={5} style={{ margin: 0 }}>
                Suppliers
              </Typography.Title>
            }
            extra={
              enquiry.status === 'DRAFT' && (
                <Button
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => setAddSupplierOpen(true)}
                >
                  Add Supplier
                </Button>
              )
            }
          >
            <DataTable
              columns={supplierColumns}
              dataSource={enquiry.suppliers}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Add Supplier"
        open={addSupplierOpen}
        onCancel={() => setAddSupplierOpen(false)}
        onOk={handleAddSupplier}
        confirmLoading={addingSupplier}
        okButtonProps={{ disabled: !selectedSupplierId }}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select a supplier"
          options={availableSupplierOptions}
          value={selectedSupplierId}
          onChange={setSelectedSupplierId}
          showSearch
          filterOption={(input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
        />
      </Modal>
    </div>
  )
}

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DiffOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Col, Descriptions, Row, Select, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { SUMMARY_PROPS } from '@/components/erp/detailSummary'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useSuppliers } from '@/modules/masters/hooks/useSuppliers'
import type {
  PurchaseEnquiry,
  PurchaseEnquiryItem,
  PurchaseEnquirySupplier,
} from '@/types/procurement'
import { PurchaseEnquiryFormDrawer } from '../components/PurchaseEnquiryFormDrawer'
import { QuotationComparisonDrawer } from '../components/QuotationComparisonDrawer'
import { SupplierQuotationFormDrawer } from '../components/SupplierQuotationFormDrawer'
import {
  ENQUIRY_STATUS_BADGE,
  ENQUIRY_STATUS_LABELS,
  SUPPLIER_STATUS_BADGE,
  SUPPLIER_STATUS_LABELS,
} from '../constants'
import {
  useAddSupplierToEnquiry,
  usePurchaseEnquiry,
  useQuotationComparison,
  useRemoveSupplierFromEnquiry,
} from '../hooks/usePurchaseEnquiries'
import {
  useCreatePurchaseOrderFromEnquiry,
  usePurchaseOrders,
  useSelectSupplierForEnquiry,
} from '../hooks/usePurchaseOrders'
import { getErrorMessage } from '@/api/client'

const formatDateTime = (v?: string | null) => (v ? dayjs(v).format('DD-MM-YYYY HH:mm') : '—')

// Same LOCKED_STATUSES as ERP-BE's PurchaseEnquiryService::updateEnquiry.
const LOCKED_STATUSES: PurchaseEnquiry['status'][] = [
  'SUPPLIER_SELECTED',
  'PO_CREATED',
  'CLOSED',
  'CANCELLED',
]

export const PurchaseEnquiryDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [editOpen, setEditOpen] = useState(false)
  const { data: enquiry, isLoading } = usePurchaseEnquiry(id)
  const { data: suppliers = [] } = useSuppliers()
  const { data: purchaseOrders } = usePurchaseOrders()
  const { mutateAsync: addSupplier, isPending: addingSupplier } = useAddSupplierToEnquiry()
  const { mutateAsync: removeSupplier } = useRemoveSupplierFromEnquiry()
  const { mutateAsync: createPO, isPending: creatingPO } = useCreatePurchaseOrderFromEnquiry()
  const { mutateAsync: selectSupplier, isPending: selectingSupplier } =
    useSelectSupplierForEnquiry()
  const { data: comparison } = useQuotationComparison(id)

  const [addSupplierOpen, setAddSupplierOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>()
  const [quotationPeSupplierId, setQuotationPeSupplierId] = useState<string | undefined>()
  const [compareOpen, setCompareOpen] = useState(false)
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
      message.error(getErrorMessage(error))
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
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleSelectSupplier = async (enquiryId: string, supplier: PurchaseEnquirySupplier) => {
    const quotationId = comparison
      .flatMap(row => row.quotes)
      .find(q => q.supplierId === supplier.supplierId)?.supplierQuotationId
    if (!quotationId) {
      message.error('No recorded quotation found for this supplier')
      return
    }
    try {
      await selectSupplier({ enquiryId, supplierId: supplier.supplierId, quotationId })
      message.success('Quotation accepted')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleCreatePO = async () => {
    try {
      const po = await createPO({ enquiryId: enquiry.id })
      message.success('Purchase order created')
      navigate(`/purchase/orders/${po.id}`)
    } catch (error) {
      message.error(getErrorMessage(error))
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
    { title: 'Sent At', dataIndex: 'sentAt', key: 'sentAt', render: formatDateTime },
    {
      title: 'Responded At',
      dataIndex: 'responseReceivedAt',
      key: 'responseReceivedAt',
      render: formatDateTime,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, r: PurchaseEnquirySupplier) => (
        <Space size="small" wrap>
          {!LOCKED_STATUSES.includes(enquiry.status) && (
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => setQuotationPeSupplierId(r.id)}
            >
              {r.supplierStatus === 'RESPONDED' ||
              r.supplierStatus === 'SELECTED' ||
              r.supplierStatus === 'NOT_SELECTED'
                ? 'View / Edit Quotation'
                : 'Record Quotation'}
            </Button>
          )}
          {r.supplierStatus === 'RESPONDED' && (
            <Button
              type="primary"
              size="small"
              loading={selectingSupplier}
              onClick={() => handleSelectSupplier(enquiry.id, r)}
            >
              Accept
            </Button>
          )}
          {enquiry.status === 'SENT' && (
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

  const canCompare = enquiry.status !== 'SENT'

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
            {!LOCKED_STATUSES.includes(enquiry.status) && (
              <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            )}
            {canCompare && (
              <Button icon={<DiffOutlined />} onClick={() => setCompareOpen(true)}>
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

      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card>
            <Descriptions {...SUMMARY_PROPS}>
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
              enquiry.status === 'SENT' && (
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

      <PurchaseEnquiryFormDrawer
        open={editOpen}
        enquiryId={enquiry.id}
        onClose={() => setEditOpen(false)}
      />

      <SupplierQuotationFormDrawer
        open={!!quotationPeSupplierId}
        enquiryId={enquiry.id}
        initialPeSupplierId={quotationPeSupplierId}
        onClose={() => setQuotationPeSupplierId(undefined)}
      />

      <QuotationComparisonDrawer
        open={compareOpen}
        enquiryId={enquiry.id}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  )
}

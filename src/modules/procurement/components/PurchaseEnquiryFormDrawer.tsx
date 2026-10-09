import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, DatePicker, Form, Input, InputNumber, Radio, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useSuppliers } from '@/modules/masters/hooks/useSuppliers'
import type { Priority, PurchaseEnquiryStatus, PurchaseEnquirySupplier } from '@/types/procurement'
import {
  ENQUIRY_STATUS_BADGE,
  ENQUIRY_STATUS_LABELS,
  PRIORITY_OPTIONS,
  SUPPLIER_STATUS_BADGE,
  SUPPLIER_STATUS_LABELS,
} from '../constants'
import { useUoms } from '@/modules/masters/hooks/useUoms'
import { useProcurementItems } from '../hooks/useProcurementItems'
import {
  useCreatePurchaseEnquiryFromRequisitions,
  useCreatePurchaseEnquiryManual,
  usePurchaseEnquiry,
  useUpdatePurchaseEnquiry,
} from '../hooks/usePurchaseEnquiries'
import type {
  PurchaseEnquiryItemInput,
  PurchaseEnquiryManualInput,
  PurchaseEnquirySupplierInput,
} from '../hooks/usePurchaseEnquiries'
import {
  usePurchaseRequisitions,
  usePurchaseRequisitionsByIds,
} from '../hooks/usePurchaseRequisitions'
import { getErrorMessage } from '@/api/client'

type Mode = 'manual' | 'fromRequisitions'

// Mirrors PurchaseEnquiryService::updateEnquiry's LOCKED_STATUSES check on ERP-BE.
const LOCKED_STATUSES: PurchaseEnquiryStatus[] = [
  'SUPPLIER_SELECTED',
  'PO_CREATED',
  'CLOSED',
  'CANCELLED',
]

interface ManualItemRowValues {
  itemId: string
  itemDescription?: string
  requiredQty: number
  uomId?: string
  requiredDate?: dayjs.Dayjs
  preferredDeliveryDate?: dayjs.Dayjs
  remarks?: string
}

export interface PurchaseEnquiryFormDrawerProps {
  open: boolean
  onClose: () => void
  /** Omit to create a new enquiry; pass an id to edit that one. */
  enquiryId?: string
  /** Create-only: defaults the drawer into "from requisitions" mode with this PR pre-selected. */
  fromRequisitionId?: string
}

export const PurchaseEnquiryFormDrawer: FC<PurchaseEnquiryFormDrawerProps> = ({
  open,
  onClose,
  enquiryId,
  fromRequisitionId,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const isEdit = !!enquiryId
  const [mode, setMode] = useState<Mode>(fromRequisitionId ? 'fromRequisitions' : 'manual')
  // Re-derive the default mode each time the drawer opens for a create (not during an
  // effect, to avoid the extra render-commit-effect round trip — see React's "adjusting
  // state when a prop changes" pattern).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open && !isEdit) setMode(fromRequisitionId ? 'fromRequisitions' : 'manual')
  }

  const { data: enquiry } = usePurchaseEnquiry(enquiryId)
  const { data: suppliers = [] } = useSuppliers()
  const { data: items } = useProcurementItems()
  const { data: requisitions } = usePurchaseRequisitions()
  const { data: uoms = [] } = useUoms()
  const selectedReqIds = Form.useWatch('requisitionIds', form) as string[] | undefined
  const { mutateAsync: createManual, isPending: creatingManual } = useCreatePurchaseEnquiryManual()
  const { mutateAsync: createFromRequisitions, isPending: creatingFromPr } =
    useCreatePurchaseEnquiryFromRequisitions()
  const { mutateAsync: updateEnquiry, isPending: updating } = useUpdatePurchaseEnquiry()

  const supplierOptions = suppliers.map(s => ({ label: `${s.code} — ${s.name}`, value: s.id }))
  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))
  const requisitionOptions = requisitions
    .filter(pr => pr.status === 'APPROVED')
    .map(pr => ({ label: pr.requisitionNumber, value: pr.id }))
  const selectedPrs = usePurchaseRequisitionsByIds(selectedReqIds ?? [])
  const previewItems = selectedPrs.flatMap(pr =>
    pr.items
      .filter(item => item.pendingQty > 0)
      .map(item => ({ ...item, prNumber: pr.requisitionNumber })),
  )

  // Fully blocked — LOCKED_STATUSES on ERP-BE rejects update entirely.
  const isLocked = isEdit && !!enquiry && LOCKED_STATUSES.includes(enquiry.status)
  // Items/supplier_ids can only be changed while the enquiry is still SENT; past that
  // only header fields (date/due-date/priority/remarks) stay editable.
  const itemsEditable = !isEdit || enquiry?.status === 'SENT'

  const buildSuppliers = (supplierIds: string[]): PurchaseEnquirySupplierInput[] =>
    supplierIds.map(id => {
      const supplier = suppliers.find(s => s.id === id)
      return { supplierId: id, supplierCode: supplier?.code, supplierName: supplier?.name }
    })

  const buildItemRows = (rows: ManualItemRowValues[]): PurchaseEnquiryItemInput[] =>
    rows.map(row => {
      const item = items.find(i => i.id === row.itemId)
      const uom = uoms.find(u => String(u.id) === String(row.uomId))
      return {
        itemId: row.itemId,
        itemCode: item?.code,
        itemName: item?.name,
        itemDescription: row.itemDescription,
        requiredQty: row.requiredQty,
        uomId: row.uomId ?? item?.uomId ?? null,
        uomName: uom?.name ?? item?.uomName,
        requiredDate: row.requiredDate ? row.requiredDate.format('YYYY-MM-DD') : null,
        preferredDeliveryDate: row.preferredDeliveryDate
          ? row.preferredDeliveryDate.format('YYYY-MM-DD')
          : null,
        remarks: row.remarks,
      }
    })

  useEffect(() => {
    if (!open) return
    if (isEdit && enquiry) {
      form.setFieldsValue({
        enquiryDate: dayjs(enquiry.enquiryDate),
        enquiryDueDate: enquiry.enquiryDueDate ? dayjs(enquiry.enquiryDueDate) : undefined,
        priority: enquiry.priority,
        remarks: enquiry.remarks,
        items: enquiry.items.map(item => ({
          itemId: item.itemId,
          itemDescription: item.itemDescription,
          requiredQty: item.requiredQty,
          uomId: item.uomId ?? undefined,
          requiredDate: item.requiredDate ? dayjs(item.requiredDate) : undefined,
          preferredDeliveryDate: item.preferredDeliveryDate
            ? dayjs(item.preferredDeliveryDate)
            : undefined,
          remarks: item.remarks,
        })),
        supplierIds: enquiry.suppliers.map(s => s.supplierId),
      })
    } else if (!isEdit) {
      form.resetFields()
      if (fromRequisitionId) {
        form.setFieldsValue({ requisitionIds: [fromRequisitionId] })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, enquiry?.id, form])

  const handleClose = () => {
    form.resetFields()
    onClose()
  }

  const handleSubmit = async () => {
    if (isLocked) return
    let values: {
      enquiryDate: dayjs.Dayjs
      enquiryDueDate?: dayjs.Dayjs
      priority: Priority
      remarks?: string
      supplierIds?: string[]
      items?: ManualItemRowValues[]
      requisitionIds?: string[]
    }
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const enquiryDate = values.enquiryDate.format('YYYY-MM-DD')
    const enquiryDueDate = values.enquiryDueDate ? values.enquiryDueDate.format('YYYY-MM-DD') : null

    try {
      if (isEdit && enquiry) {
        const payload: Partial<PurchaseEnquiryManualInput> = {
          enquiryDate,
          enquiryDueDate,
          priority: values.priority,
          remarks: values.remarks,
        }
        if (itemsEditable) {
          payload.items = buildItemRows(values.items ?? [])
          payload.suppliers = buildSuppliers(values.supplierIds ?? [])
        }
        await updateEnquiry({ id: enquiry.id, payload })
      } else if (mode === 'manual') {
        await createManual({
          enquiryDate,
          enquiryDueDate,
          priority: values.priority,
          remarks: values.remarks,
          items: buildItemRows(values.items ?? []),
          suppliers: buildSuppliers(values.supplierIds ?? []),
        })
      } else {
        await createFromRequisitions({
          requisitionIds: values.requisitionIds ?? [],
          enquiryDate,
          enquiryDueDate,
          priority: values.priority,
          remarks: values.remarks,
          suppliers: buildSuppliers(values.supplierIds ?? []),
        })
      }
      message.success(`Purchase enquiry ${isEdit ? 'updated' : 'created'} successfully`)
      handleClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const showItemsSection = (!isEdit && mode === 'manual') || isEdit

  return (
    <FormDrawer
      title={isEdit ? 'Edit Purchase Enquiry' : 'New Purchase Enquiry'}
      status={isEdit && enquiry ? ENQUIRY_STATUS_BADGE[enquiry.status] : undefined}
      statusLabel={isEdit && enquiry ? ENQUIRY_STATUS_LABELS[enquiry.status] : undefined}
      open={open}
      width={960}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={creatingManual || creatingFromPr || updating}
      submitText={isEdit ? 'Update Enquiry' : 'Save Enquiry'}
      hideFooter={isLocked}
    >
      {isLocked ? (
        <Typography.Text>
          This purchase enquiry can no longer be edited. It is{' '}
          {enquiry ? ENQUIRY_STATUS_LABELS[enquiry.status] : ''}.
        </Typography.Text>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ enquiryDate: dayjs(), priority: 'NORMAL', items: [{}] }}
        >
          <FormSection title="Enquiry Details">
            {!isEdit && (
              <Form.Item label="Source">
                <Radio.Group value={mode} onChange={e => setMode(e.target.value as Mode)}>
                  <Radio.Button value="manual">Manual Entry</Radio.Button>
                  <Radio.Button value="fromRequisitions">From Purchase Requisitions</Radio.Button>
                </Radio.Group>
              </Form.Item>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
              <Form.Item
                label="Enquiry Date"
                name="enquiryDate"
                rules={[{ required: true, message: 'Date is required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Due Date" name="enquiryDueDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Priority" name="priority">
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
            </div>
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} />
            </Form.Item>

            {isEdit && !itemsEditable && (
              <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Items and suppliers can no longer be changed once the enquiry has been sent.
              </Typography.Paragraph>
            )}

            {itemsEditable ? (
              <Form.Item
                label="Suppliers"
                name="supplierIds"
                rules={[
                  { required: true, message: 'Add at least one supplier' },
                  {
                    validator: (_, value) => {
                      if (!value || value.length === 0) return Promise.resolve()
                      const unique = new Set(value)
                      if (unique.size !== value.length) {
                        return Promise.reject(new Error('Duplicate suppliers not allowed'))
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select suppliers"
                  options={supplierOptions}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>
            ) : (
              <Form.Item label="Suppliers">
                <DataTable<PurchaseEnquirySupplier>
                  columns={[
                    {
                      title: 'Supplier',
                      key: 'supplier',
                      render: (_, r) => r.supplierName ?? r.supplierId,
                    },
                    {
                      title: 'Status',
                      key: 'status',
                      render: (_, r) => (
                        <StatusBadge
                          status={SUPPLIER_STATUS_BADGE[r.supplierStatus]}
                          label={SUPPLIER_STATUS_LABELS[r.supplierStatus]}
                        />
                      ),
                    },
                  ]}
                  dataSource={enquiry?.suppliers ?? []}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Form.Item>
            )}

            {!isEdit && mode === 'fromRequisitions' && (
              <>
                <Form.Item
                  label="Purchase Requisitions"
                  name="requisitionIds"
                  rules={[{ required: true, message: 'Select at least one requisition' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select approved requisitions with pending items"
                    options={requisitionOptions}
                  />
                </Form.Item>

                {selectedReqIds?.length ? (
                  <Form.Item label="Items">
                    <DataTable
                      columns={[
                        { title: 'P.R. No', dataIndex: 'prNumber', key: 'prNumber' },
                        { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode' },
                        { title: 'Item Name', dataIndex: 'itemName', key: 'itemName' },
                        { title: 'Pending Qty', dataIndex: 'pendingQty', key: 'pendingQty' },
                        { title: 'UOM', dataIndex: 'uomName', key: 'uomName' },
                        {
                          title: 'Required Date',
                          dataIndex: 'requiredDate',
                          key: 'requiredDate',
                          render: (v: string | null) => v ?? '—',
                        },
                      ]}
                      dataSource={previewItems}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </Form.Item>
                ) : null}
              </>
            )}
          </FormSection>

          {showItemsSection && (
            <FormSection title="Items">
              {itemsEditable ? (
                <Form.List
                  name="items"
                  rules={[
                    {
                      validator: async (_, v) => {
                        if (!v || v.length === 0) throw new Error('Add at least one item')
                        const itemIds = v
                          .map((row: ManualItemRowValues) => row.itemId)
                          .filter(Boolean)
                        const unique = new Set(itemIds)
                        if (unique.size !== itemIds.length) {
                          throw new Error('Duplicate items not allowed')
                        }
                      },
                    },
                  ]}
                >
                  {(fields, { add, remove }, { errors }) => (
                    <>
                      {fields.map(field => (
                        <div
                          key={field.key}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 100px 90px 130px 130px 1fr 32px',
                            gap: '0 8px',
                            alignItems: 'start',
                          }}
                        >
                          <Form.Item
                            name={[field.name, 'itemId']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <Select
                              placeholder="Select item"
                              options={itemOptions}
                              showSearch
                              filterOption={(input, option) =>
                                String(option?.label ?? '')
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, 'itemDescription']}>
                            <Input placeholder="Description" />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'requiredQty']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <InputNumber placeholder="Qty" min={0.0001} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item
                            name={[field.name, 'uomId']}
                            rules={[{ required: true, message: 'Required' }]}
                          >
                            <Select
                              placeholder="UOM"
                              options={uoms.map(u => ({ label: u.name, value: u.id }))}
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, 'requiredDate']}>
                            <DatePicker placeholder="Required by" style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name={[field.name, 'preferredDeliveryDate']}>
                            <DatePicker
                              placeholder="Preferred delivery"
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                          <Form.Item name={[field.name, 'remarks']}>
                            <Input placeholder="Remarks" />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          />
                        </div>
                      ))}
                      <Form.ErrorList errors={errors} />
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add()}
                        style={{ width: '100%', marginTop: 8 }}
                      >
                        Add Item
                      </Button>
                    </>
                  )}
                </Form.List>
              ) : (
                <DataTable
                  columns={[
                    {
                      title: 'Item',
                      key: 'item',
                      render: (_: unknown, r: { itemName?: string; itemId: string }) =>
                        r.itemName ?? r.itemId,
                    },
                    { title: 'Required Qty', dataIndex: 'requiredQty', key: 'requiredQty' },
                    { title: 'UOM', dataIndex: 'uomName', key: 'uomName' },
                    {
                      title: 'Required Date',
                      dataIndex: 'requiredDate',
                      key: 'requiredDate',
                      render: (v: string | null) => v ?? '—',
                    },
                  ]}
                  dataSource={enquiry?.items ?? []}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              )}
            </FormSection>
          )}
        </Form>
      )}
    </FormDrawer>
  )
}

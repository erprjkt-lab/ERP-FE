import { DeleteOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd'
import type { FormInstance, FormListFieldData } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import type { LocationOption } from '@/modules/inventory/hooks/useLocations'
import { useMaterialGradeList } from '@/modules/masters/hooks/useMaterialGrades'
import { useSuppliers } from '@/modules/masters/hooks/useSuppliers'
import type { MaterialGrade } from '@/types/masters'
import type { ProcurementItemOption } from '../hooks/useProcurementItems'
import { useProcurementItems } from '../hooks/useProcurementItems'
import type { GrnItemInput } from '../hooks/usePurchaseGrns'
import { useCreateGrn } from '../hooks/usePurchaseGrns'
import { usePurchaseOrder, usePurchaseOrders } from '../hooks/usePurchaseOrders'

interface GrnRowValues {
  poItemId: string
  itemId: string
  receivedQty: number
  locationId: string
  gradeId?: string
  rate?: number
  commercialUnit?: string
  commercialQty?: number
  batchNo?: string
  heatNo?: string
  serialNumbers?: string[]
  remarks?: string
}

interface PoItemInfo {
  itemName?: string
  uomName?: string
  orderedQty: number
}

export const PurchaseGrnForm: FC = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data: suppliers } = useSuppliers()
  const { data: purchaseOrders } = usePurchaseOrders()
  const { data: items } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: grades } = useMaterialGradeList()
  const { mutateAsync: createGrn, isPending: creating } = useCreateGrn()

  const [selectedPoId, setSelectedPoId] = useState<string | undefined>(undefined)
  const [selectedPoItemIds, setSelectedPoItemIds] = useState<string[]>([])
  const [poItemInfo, setPoItemInfo] = useState<Record<string, PoItemInfo>>({})

  const { data: selectedPo } = usePurchaseOrder(selectedPoId)

  const supplierId = Form.useWatch('supplierId', form) as string | undefined

  const supplierOptions = (suppliers ?? []).map(s => ({ label: s.name, value: s.id }))

  const poOptions = purchaseOrders
    .filter(po => po.status !== 'CANCELLED' && (!supplierId || po.supplierId === supplierId))
    .map(po => ({ label: `${po.poNumber} — ${po.supplierName ?? ''}`, value: po.id }))

  const poItemOptions = (selectedPo?.items ?? []).map(item => ({
    label: `${item.itemName ?? item.itemId} — Ordered: ${item.orderedQty} ${item.uomName ?? ''}`,
    value: item.id,
  }))

  const handleFinish = async (values: {
    supplierId: string
    grnDate: dayjs.Dayjs
    supplierDocNo?: string
    supplierDocDate?: dayjs.Dayjs
    remarks?: string
    items: GrnRowValues[]
  }) => {
    const itemRows: GrnItemInput[] = values.items.map(row => ({
      poItemId: row.poItemId,
      itemId: row.itemId,
      gradeId: row.gradeId ?? null,
      receivedQty: row.receivedQty,
      commercialUnit: row.commercialUnit ?? null,
      commercialQty: row.commercialQty ?? null,
      rate: row.rate ?? null,
      batchNo: row.batchNo ?? null,
      heatNo: row.heatNo ?? null,
      serialNumbers: row.serialNumbers ?? null,
      locationId: row.locationId,
      remarks: row.remarks,
    }))

    try {
      const created = await createGrn({
        supplierId: values.supplierId,
        supplierDocNo: values.supplierDocNo ?? null,
        supplierDocDate: values.supplierDocDate
          ? values.supplierDocDate.format('YYYY-MM-DD')
          : null,
        grnDate: values.grnDate.format('YYYY-MM-DD'),
        remarks: values.remarks,
        items: itemRows,
      })
      message.success('GRN created successfully')
      navigate(`/purchase/grn/${created.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title="New GRN"
        breadcrumbs={[
          { label: 'Purchase', href: '/purchase' },
          { label: 'GRN', href: '/purchase/grn' },
          { label: 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/purchase/grn')}>Cancel</Button>
            <Button type="primary" loading={creating} onClick={() => form.submit()}>
              Save GRN
            </Button>
          </Space>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ grnDate: dayjs(), items: [] }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
            <Form.Item
              label="Supplier"
              name="supplierId"
              rules={[{ required: true, message: 'Supplier is required' }]}
            >
              <Select
                placeholder="Select supplier"
                options={supplierOptions}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={() => {
                  setSelectedPoId(undefined)
                  setSelectedPoItemIds([])
                }}
              />
            </Form.Item>
            <Form.Item
              label="GRN Date"
              name="grnDate"
              rules={[{ required: true, message: 'GRN date is required' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Supplier Doc No" name="supplierDocNo">
              <Input placeholder="Supplier challan no." />
            </Form.Item>
            <Form.Item label="Supplier Doc Date" name="supplierDocDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Typography.Title level={5}>Items</Typography.Title>

          <Form.List
            name="items"
            rules={[
              {
                validator: async (_, v) => {
                  if (!v || v.length === 0) throw new Error('Add at least one item from a PO')
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => {
              const existingPoItemIds = new Set(
                fields.map(f => form.getFieldValue(['items', f.name, 'poItemId'])),
              )

              const handleAddItems = () => {
                selectedPoItemIds.forEach(poItemId => {
                  if (existingPoItemIds.has(poItemId)) return
                  const poItem = selectedPo?.items.find(i => i.id === poItemId)
                  if (!poItem) return
                  setPoItemInfo(prev => ({
                    ...prev,
                    [poItemId]: {
                      itemName: poItem.itemName,
                      uomName: poItem.uomName,
                      orderedQty: poItem.orderedQty,
                    },
                  }))
                  add({
                    poItemId,
                    itemId: poItem.itemId,
                    receivedQty: poItem.orderedQty,
                    rate: poItem.rate,
                  })
                })
                setSelectedPoItemIds([])
              }

              return (
                <>
                  <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr auto',
                        gap: '0 8px',
                        alignItems: 'end',
                      }}
                    >
                      <div>
                        <Typography.Text type="secondary">Purchase Order</Typography.Text>
                        <Select
                          placeholder="Select PO to receive against"
                          value={selectedPoId}
                          onChange={v => {
                            setSelectedPoId(v)
                            setSelectedPoItemIds([])
                          }}
                          options={poOptions}
                          showSearch
                          allowClear
                          filterOption={(input, option) =>
                            String(option?.label ?? '')
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div>
                        <Typography.Text type="secondary">PO Items</Typography.Text>
                        <Select
                          mode="multiple"
                          placeholder="Select items to receive"
                          value={selectedPoItemIds}
                          onChange={setSelectedPoItemIds}
                          options={poItemOptions}
                          disabled={!selectedPoId}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <Button
                        type="dashed"
                        disabled={selectedPoItemIds.length === 0}
                        onClick={handleAddItems}
                      >
                        Add Selected Items
                      </Button>
                    </div>
                  </Card>

                  {fields.map(field => (
                    <GrnItemRow
                      key={field.key}
                      field={field}
                      form={form}
                      items={items}
                      locations={locations}
                      grades={grades}
                      poItemInfo={poItemInfo}
                      onRemove={() => remove(field.name)}
                    />
                  ))}
                  <Form.ErrorList errors={errors} />
                </>
              )
            }}
          </Form.List>
        </Form>
      </Card>
    </div>
  )
}

interface GrnItemRowProps {
  field: FormListFieldData
  form: FormInstance
  items: ProcurementItemOption[]
  locations: LocationOption[]
  grades: MaterialGrade[]
  poItemInfo: Record<string, PoItemInfo>
  onRemove: () => void
}

const GrnItemRow: FC<GrnItemRowProps> = ({
  field,
  form,
  items,
  locations,
  grades,
  poItemInfo,
  onRemove,
}) => {
  const poItemId = Form.useWatch(['items', field.name, 'poItemId'], form) as string | undefined
  const itemId = Form.useWatch(['items', field.name, 'itemId'], form) as string | undefined
  const receivedQty = Form.useWatch(['items', field.name, 'receivedQty'], form) as
    number | undefined

  const info = poItemId ? poItemInfo[poItemId] : undefined
  const selectedItem = items.find(i => i.id === itemId)
  const locationOptions = locations.map(l => ({ label: `${l.code} — ${l.name}`, value: l.id }))
  const gradeOptions = grades.map(g => ({ label: g.materialGrade, value: g.id }))

  return (
    <Card size="small" style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 32px',
          gap: '0 8px',
          alignItems: 'start',
        }}
      >
        <Form.Item name={[field.name, 'poItemId']} hidden>
          <Input />
        </Form.Item>
        <Form.Item name={[field.name, 'itemId']} hidden>
          <Input />
        </Form.Item>
        <div style={{ paddingTop: 6 }}>
          <Typography.Text strong>{info?.itemName ?? selectedItem?.name}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Ordered: {info?.orderedQty ?? '—'} {info?.uomName ?? ''}
          </Typography.Text>
        </div>
        <Form.Item
          name={[field.name, 'receivedQty']}
          label="Received Qty"
          rules={[
            { required: true, message: 'Required' },
            { type: 'number', min: 0.001, message: 'Must be > 0' },
            ...(selectedItem?.serialTracking
              ? [
                  {
                    validator: async (_: unknown, v: number) => {
                      if (!Number.isInteger(v)) {
                        throw new Error('Must be a whole number for serial-tracked items')
                      }
                    },
                  },
                ]
              : []),
          ]}
        >
          <InputNumber min={0.001} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name={[field.name, 'locationId']}
          label="Location"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select
            placeholder="Location"
            options={locationOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>
        <Form.Item name={[field.name, 'gradeId']} label="Grade">
          <Select placeholder="Grade" options={gradeOptions} allowClear showSearch />
        </Form.Item>
        <Form.Item name={[field.name, 'rate']} label="Rate">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name={[field.name, 'remarks']} label="Remarks">
          <Input placeholder="Remarks" />
        </Form.Item>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onRemove}
          style={{ marginTop: 30 }}
        />
      </div>

      {(selectedItem?.batchTracking ||
        selectedItem?.heatTracking ||
        selectedItem?.serialTracking) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 2fr',
            gap: '0 8px',
            borderTop: '1px dashed #d9d9d9',
            paddingTop: 8,
          }}
        >
          {selectedItem?.batchTracking && (
            <Form.Item
              name={[field.name, 'batchNo']}
              label="Batch No"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Batch no." />
            </Form.Item>
          )}
          {selectedItem?.heatTracking && (
            <Form.Item
              name={[field.name, 'heatNo']}
              label="Heat No"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Heat no." />
            </Form.Item>
          )}
          {selectedItem?.serialTracking && (
            <Form.Item
              name={[field.name, 'serialNumbers']}
              label="Serial Numbers"
              rules={[
                {
                  validator: async (_, v: string[] | undefined) => {
                    const count = v?.length ?? 0
                    if (count !== (receivedQty ?? 0)) {
                      throw new Error(`Enter exactly ${receivedQty ?? 0} serial number(s)`)
                    }
                  },
                },
              ]}
            >
              <Select
                mode="tags"
                open={false}
                tokenSeparators={[',', ' ']}
                placeholder="Type or paste serial numbers"
              />
            </Form.Item>
          )}
        </div>
      )}
    </Card>
  )
}

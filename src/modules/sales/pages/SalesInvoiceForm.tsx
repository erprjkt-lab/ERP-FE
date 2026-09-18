import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import type { CSSProperties, FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { StockAllocator } from '../components/StockAllocator'
import { useDeliveryChallan } from '../hooks/useDeliveryChallans'
import type { StockLineInput } from '../hooks/useDeliveryChallans'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import {
  useCreateSalesInvoice,
  useCreateSalesInvoiceFromChallan,
  useSalesInvoice,
  useUpdateSalesInvoice,
} from '../hooks/useSalesInvoices'
import type { SalesInvoiceItemInput } from '../hooks/useSalesInvoices'

const FIELD_LABEL: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'rgba(0,0,0,0.65)',
  marginBottom: 4,
}

interface HeaderValues {
  partyId?: string
  invoiceDate: dayjs.Dayjs
  gstin?: string
  partyStateCode?: string
  remarks?: string
}

interface DirectLine {
  key: string
  itemId?: string
  rate: number
  discountPercent?: number
  taxPercent?: number
  stocks: StockLineInput[]
}

export const SalesInvoiceForm: FC = () => {
  const { id } = useParams()
  const isEdit = !!id
  const [searchParams] = useSearchParams()
  const challanId = searchParams.get('challanId')
  const fromChallan = !!challanId
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<HeaderValues>()

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { data: challan, isLoading: challanLoading } = useDeliveryChallan(challanId ?? undefined)
  const { mutateAsync: createDirect, isPending: creatingDirect } = useCreateSalesInvoice()
  const { mutateAsync: createFromChallan, isPending: creatingFromChallan } =
    useCreateSalesInvoiceFromChallan()
  const { data: existing, isLoading: existingLoading } = useSalesInvoice(id)
  const { mutateAsync: updateInvoice, isPending: updating } = useUpdateSalesInvoice()

  const [directLines, setDirectLines] = useState<DirectLine[]>([])
  // Billed qty per delivery-challan line id, for the from-challan path.
  const [challanQty, setChallanQty] = useState<Record<string, number>>({})

  // Form.setFieldsValue targets the (non-React) Form instance, so it belongs in
  // an effect; the line state is adjusted during render instead, which is what
  // React recommends over setting state from an effect body.
  useEffect(() => {
    if (!existing) return
    form.setFieldsValue({
      invoiceDate: dayjs(existing.invoiceDate),
      partyId: String(existing.partyId),
      gstin: existing.gstin ?? undefined,
      partyStateCode: existing.partyStateCode ?? undefined,
      remarks: existing.remarks ?? undefined,
    })
  }, [existing, form])

  const [loadedInvoiceId, setLoadedInvoiceId] = useState<string>()
  if (existing && existing.id !== loadedInvoiceId) {
    setLoadedInvoiceId(existing.id)
    setDirectLines(
      existing.items.map((item, index) => ({
        key: `existing-${item.id}-${index}`,
        itemId: String(item.itemId),
        rate: item.rate,
        discountPercent: item.discountPercent || undefined,
        taxPercent: item.taxPercent || undefined,
        stocks: item.stocks.map(stock => ({
          locationId: String(stock.locationId),
          batchNo: stock.batchNo ?? null,
          heatNo: stock.heatNo ?? null,
          serialNo: stock.serialNo ?? null,
          qty: stock.qty,
        })),
      })),
    )
  }

  const billableLines = (challan?.items ?? [])
    .map(line => ({ line, unbilled: Math.max(line.dispatchQty - line.billedQty, 0) }))
    .filter(({ unbilled }) => unbilled > 0)

  const submitFromChallan = async (header: HeaderValues) => {
    const lines = billableLines
      .map(({ line }) => ({
        delivery_challan_item_id: Number(line.id),
        qty: challanQty[String(line.id)] ?? 0,
      }))
      .filter(line => line.qty > 0)

    if (lines.length === 0) {
      message.error('Enter a quantity to bill on at least one line')
      return
    }

    const overBilled = billableLines.find(
      ({ line, unbilled }) => (challanQty[String(line.id)] ?? 0) > unbilled,
    )
    if (overBilled) {
      message.error('Billed quantity exceeds the unbilled balance on a challan line')
      return
    }

    const invoice = await createFromChallan({
      invoice_date: header.invoiceDate.format('YYYY-MM-DD'),
      remarks: header.remarks ?? null,
      items: lines,
    })
    message.success(`Invoice ${invoice.invoiceNumber} created`)
    navigate(`/sales/invoices/${invoice.id}`)
  }

  const submitDirect = async (header: HeaderValues) => {
    if (!header.partyId) {
      message.error('Select a customer')
      return
    }

    const lines: SalesInvoiceItemInput[] = directLines
      .filter(line => line.itemId && line.stocks.reduce((sum, s) => sum + s.qty, 0) > 0)
      .map(line => {
        const item = items.find(i => i.id === line.itemId)
        return {
          itemId: line.itemId as string,
          uomId: item?.uomId ?? null,
          rate: line.rate,
          discountPercent: line.discountPercent ?? null,
          taxPercent: line.taxPercent ?? null,
          stocks: line.stocks,
        }
      })

    if (lines.length === 0) {
      message.error('Allocate stock for at least one line')
      return
    }

    const input = {
      partyId: header.partyId,
      invoiceDate: header.invoiceDate.format('YYYY-MM-DD'),
      gstin: header.gstin ?? null,
      partyStateCode: header.partyStateCode ?? null,
      remarks: header.remarks ?? null,
      items: lines,
    }

    const invoice = isEdit ? await updateInvoice({ id, input }) : await createDirect(input)
    message.success(isEdit ? 'Sales invoice updated' : `Invoice ${invoice.invoiceNumber} created`)
    navigate(`/sales/invoices/${invoice.id}`)
  }

  const handleSubmit = async () => {
    let header: HeaderValues
    try {
      header = await form.validateFields()
    } catch {
      return
    }

    try {
      if (fromChallan) {
        await submitFromChallan(header)
      } else {
        await submitDirect(header)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title={
          isEdit
            ? `Edit ${existing?.invoiceNumber ?? 'Invoice'}`
            : fromChallan
              ? 'Invoice from Delivery Challan'
              : 'New Sales Invoice'
        }
        subtitle={
          fromChallan
            ? 'Billing already-dispatched goods — this does not move stock again'
            : 'Direct invoice — stock is issued as part of creating it'
        }
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Sales Invoice', href: '/sales/invoices' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/sales/invoices')}>Cancel</Button>
            <Button
              type="primary"
              loading={creatingDirect || creatingFromChallan || updating}
              onClick={handleSubmit}
            >
              {isEdit ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </Space>
        }
      />

      <Card loading={(fromChallan && challanLoading) || (isEdit && existingLoading)}>
        {fromChallan && challan && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={`Billing against challan ${challan.challanNumber} — ${challan.partyName ?? ''}`}
            description="The customer and tax details are taken from the challan."
          />
        )}

        <Form form={form} layout="vertical" initialValues={{ invoiceDate: dayjs() }}>
          <FormSection title="Invoice Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Invoice Date"
                  name="invoiceDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              {!fromChallan && (
                <>
                  <Col xs={24} sm={12} md={10}>
                    <Form.Item
                      label="Customer"
                      name="partyId"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Select
                        placeholder="Select customer"
                        options={customers.map(c => ({
                          label: `${c.code} — ${c.name}`,
                          value: c.id,
                        }))}
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.label ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={4}>
                    <Form.Item label="GSTIN" name="gstin">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={4}>
                    <Form.Item label="State Code" name="partyStateCode">
                      <Input maxLength={2} />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} />
            </Form.Item>
          </FormSection>
        </Form>

        {fromChallan ? (
          <FormSection title="Challan Lines to Bill">
            {billableLines.length === 0 ? (
              <Alert
                type="warning"
                showIcon
                message="Every line on this challan has already been fully billed."
              />
            ) : (
              billableLines.map(({ line, unbilled }) => (
                <Card key={line.id} size="small" style={{ marginBottom: 8 }}>
                  <Row gutter={12} align="middle">
                    <Col xs={24} md={10}>
                      <Typography.Text strong>
                        {line.itemCode ? `${line.itemCode} — ${line.itemName}` : line.itemName}
                      </Typography.Text>
                    </Col>
                    <Col xs={12} md={4}>
                      <Tag>Dispatched: {line.dispatchQty}</Tag>
                    </Col>
                    <Col xs={12} md={4}>
                      <Tag color="blue">Unbilled: {unbilled}</Tag>
                    </Col>
                    <Col xs={12} md={3}>
                      <Tag>Rate: {line.rate}</Tag>
                    </Col>
                    <Col xs={12} md={3}>
                      <label style={FIELD_LABEL}>Bill Qty</label>
                      <InputNumber
                        placeholder="Bill qty"
                        min={0}
                        max={unbilled}
                        style={{ width: '100%' }}
                        value={challanQty[String(line.id)]}
                        onChange={value =>
                          setChallanQty(current => ({
                            ...current,
                            [String(line.id)]: value ?? 0,
                          }))
                        }
                      />
                    </Col>
                  </Row>
                </Card>
              ))
            )}
          </FormSection>
        ) : (
          <FormSection title="Items">
            {directLines.map(line => (
              <Card key={line.key} size="small" style={{ marginBottom: 12 }}>
                <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
                  <Col xs={24} md={10}>
                    <label style={FIELD_LABEL}>Item</label>
                    <Select
                      placeholder="Select item"
                      value={line.itemId}
                      style={{ width: '100%' }}
                      options={items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))}
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={value =>
                        setDirectLines(current =>
                          current.map(l =>
                            l.key === line.key ? { ...l, itemId: value, stocks: [] } : l,
                          ),
                        )
                      }
                    />
                  </Col>
                  <Col xs={8} md={4}>
                    <label style={FIELD_LABEL}>Rate</label>
                    <InputNumber
                      placeholder="Rate"
                      min={0}
                      value={line.rate}
                      style={{ width: '100%' }}
                      onChange={value =>
                        setDirectLines(current =>
                          current.map(l => (l.key === line.key ? { ...l, rate: value ?? 0 } : l)),
                        )
                      }
                    />
                  </Col>
                  <Col xs={8} md={4}>
                    <label style={FIELD_LABEL}>Discount %</label>
                    <InputNumber
                      placeholder="Disc %"
                      min={0}
                      max={100}
                      value={line.discountPercent}
                      style={{ width: '100%' }}
                      onChange={value =>
                        setDirectLines(current =>
                          current.map(l =>
                            l.key === line.key ? { ...l, discountPercent: value ?? undefined } : l,
                          ),
                        )
                      }
                    />
                  </Col>
                  <Col xs={6} md={4}>
                    <label style={FIELD_LABEL}>Tax %</label>
                    <InputNumber
                      placeholder="Tax %"
                      min={0}
                      value={line.taxPercent}
                      style={{ width: '100%' }}
                      onChange={value =>
                        setDirectLines(current =>
                          current.map(l =>
                            l.key === line.key ? { ...l, taxPercent: value ?? undefined } : l,
                          ),
                        )
                      }
                    />
                  </Col>
                  <Col xs={2} md={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        setDirectLines(current => current.filter(l => l.key !== line.key))
                      }
                    />
                  </Col>
                </Row>
                <StockAllocator
                  itemId={line.itemId}
                  value={line.stocks}
                  onChange={stocks =>
                    setDirectLines(current =>
                      current.map(l => (l.key === line.key ? { ...l, stocks } : l)),
                    )
                  }
                />
              </Card>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
              onClick={() =>
                setDirectLines(current => [
                  ...current,
                  { key: `line-${Date.now()}`, rate: 0, stocks: [] },
                ])
              }
            >
              Add Item
            </Button>
          </FormSection>
        )}
      </Card>
    </div>
  )
}

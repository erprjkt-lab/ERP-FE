import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
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
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FormSection } from '@/components/ui/FormSection'
import { PageHeader } from '@/components/ui/PageHeader'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import { StockAllocator } from '../components/StockAllocator'
import { useChallansForOrder, useCreateDeliveryChallan } from '../hooks/useDeliveryChallans'
import type { DeliveryChallanItemInput, StockLineInput } from '../hooks/useDeliveryChallans'
import { useSalesCustomers } from '../hooks/useSalesCustomers'
import { useSalesOrder, useSalesOrders } from '../hooks/useSalesOrders'

const FIELD_LABEL: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'rgba(0,0,0,0.65)',
  marginBottom: 4,
}

interface HeaderValues {
  partyId: string
  challanDate: dayjs.Dayjs
  vehicleNo?: string
  lrNo?: string
  lrDate?: dayjs.Dayjs
  transporterName?: string
  gstin?: string
  partyStateCode?: string
  remarks?: string
}

interface DirectLine {
  key: string
  itemId?: string
  rate: number
  stocks: StockLineInput[]
}

export const DeliveryChallanForm: FC = () => {
  const [searchParams] = useSearchParams()
  const presetOrderId = searchParams.get('salesOrderId')
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<HeaderValues>()

  const { data: customers } = useSalesCustomers()
  const { data: items } = useProcurementItems()
  const { mutateAsync: createChallan, isPending: creating } = useCreateDeliveryChallan()

  const [partyId, setPartyId] = useState<string | undefined>()
  const [salesOrderId, setSalesOrderId] = useState<string | undefined>(presetOrderId ?? undefined)
  // Allocation per sales-order line id.
  const [orderAllocations, setOrderAllocations] = useState<Record<string, StockLineInput[]>>({})
  const [directLines, setDirectLines] = useState<DirectLine[]>([])

  // Only confirmed orders can be dispatched against, and only for this customer.
  const { data: orders } = useSalesOrders({ perPage: 100, status: 'CONFIRMED' })
  const orderOptions = orders
    .filter(order => !partyId || String(order.partyId) === partyId)
    .map(order => ({ label: `${order.orderNumber} — ${order.partyName ?? ''}`, value: order.id }))

  const { data: selectedOrder } = useSalesOrder(salesOrderId)
  const { data: orderChallans } = useChallansForOrder(salesOrderId)

  // The order resource doesn't expose dispatch_qty, so pending per line is
  // derived from the challans already raised against this order.
  const dispatchedByOrderLine = new Map<string, number>()
  for (const challan of orderChallans) {
    if (challan.status === 'CANCELLED') continue
    for (const line of challan.items) {
      if (!line.salesOrderItemId) continue
      dispatchedByOrderLine.set(
        String(line.salesOrderItemId),
        (dispatchedByOrderLine.get(String(line.salesOrderItemId)) ?? 0) + line.dispatchQty,
      )
    }
  }

  const orderLines = (selectedOrder?.items ?? []).map(line => ({
    line,
    pending: Math.max(line.qty - (dispatchedByOrderLine.get(String(line.id)) ?? 0), 0),
  }))

  const allocatedTotal = (stocks: StockLineInput[]) =>
    stocks.reduce((sum, stock) => sum + stock.qty, 0)

  const handleSubmit = async () => {
    let header: HeaderValues
    try {
      header = await form.validateFields()
    } catch {
      return
    }

    const orderItems: DeliveryChallanItemInput[] = Object.entries(orderAllocations)
      .filter(([, stocks]) => allocatedTotal(stocks) > 0)
      .map(([salesOrderItemId, stocks]) => ({ salesOrderItemId, stocks }))

    const directItems: DeliveryChallanItemInput[] = directLines
      .filter(line => line.itemId && allocatedTotal(line.stocks) > 0)
      .map(line => {
        const item = items.find(i => i.id === line.itemId)
        return {
          itemId: line.itemId,
          uomId: item?.uomId ?? null,
          rate: line.rate,
          stocks: line.stocks,
        }
      })

    const payloadItems = [...orderItems, ...directItems]
    if (payloadItems.length === 0) {
      message.error('Allocate stock for at least one line before dispatching')
      return
    }

    // Guard the one rule the backend enforces that we can check up front —
    // over-dispatching an order line is otherwise a round-trip to find out.
    const overDispatched = orderLines.find(
      ({ line, pending }) => allocatedTotal(orderAllocations[String(line.id)] ?? []) > pending,
    )
    if (overDispatched) {
      message.error(
        `Dispatch qty exceeds the pending balance on ${overDispatched.line.itemName ?? 'a line'}`,
      )
      return
    }

    try {
      const challan = await createChallan({
        partyId: header.partyId,
        challanDate: header.challanDate.format('YYYY-MM-DD'),
        vehicleNo: header.vehicleNo ?? null,
        lrNo: header.lrNo ?? null,
        lrDate: header.lrDate ? header.lrDate.format('YYYY-MM-DD') : null,
        transporterName: header.transporterName ?? null,
        gstin: header.gstin ?? null,
        partyStateCode: header.partyStateCode ?? null,
        remarks: header.remarks ?? null,
        items: payloadItems,
      })
      message.success(`Delivery challan ${challan.challanNumber} created`)
      navigate(`/sales/delivery-challans/${challan.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div>
      <PageHeader
        title="New Delivery Challan"
        subtitle="Dispatching moves stock out immediately — the challan is created as Dispatched"
        breadcrumbs={[
          { label: 'Sales' },
          { label: 'Delivery Challan', href: '/sales/delivery-challans' },
          { label: 'New' },
        ]}
        actions={
          <Space>
            <Button onClick={() => navigate('/sales/delivery-challans')}>Cancel</Button>
            <Button type="primary" loading={creating} onClick={handleSubmit}>
              Dispatch Challan
            </Button>
          </Space>
        }
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ challanDate: dayjs() }}
          onValuesChange={(changed: Partial<HeaderValues>) => {
            if (changed.partyId) {
              setPartyId(changed.partyId)
              // Order and allocations belong to the previous customer.
              setSalesOrderId(undefined)
              setOrderAllocations({})
            }
          }}
        >
          <FormSection title="Challan Details">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Challan Date"
                  name="challanDate"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={10}>
                <Form.Item
                  label="Customer"
                  name="partyId"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select
                    placeholder="Select customer"
                    options={customers.map(c => ({ label: `${c.code} — ${c.name}`, value: c.id }))}
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
            </Row>
          </FormSection>

          <FormSection title="Transport">
            <Row gutter={24}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Vehicle No" name="vehicleNo">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="LR No" name="lrNo">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="LR Date" name="lrDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item label="Transporter" name="transporterName">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} />
            </Form.Item>
          </FormSection>
        </Form>

        <FormSection title="Dispatch Against Sales Order">
          <Select
            placeholder={partyId ? 'Select a confirmed sales order' : 'Select a customer first'}
            disabled={!partyId}
            value={salesOrderId}
            onChange={value => {
              setSalesOrderId(value)
              setOrderAllocations({})
            }}
            allowClear
            style={{ width: '100%', maxWidth: 480 }}
            options={orderOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />

          {selectedOrder && orderLines.every(({ pending }) => pending <= 0) && (
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 12 }}
              message="Every line on this order has already been fully dispatched."
            />
          )}

          {orderLines
            .filter(({ pending }) => pending > 0)
            .map(({ line, pending }) => (
              <Card key={line.id} size="small" style={{ marginTop: 12 }}>
                <Space wrap style={{ marginBottom: 8 }}>
                  <Typography.Text strong>
                    {line.itemCode ? `${line.itemCode} — ${line.itemName}` : line.itemName}
                  </Typography.Text>
                  <Tag>Ordered: {line.qty}</Tag>
                  <Tag color="blue">Pending: {pending}</Tag>
                  <Tag>Rate: {line.rate}</Tag>
                </Space>
                <StockAllocator
                  itemId={String(line.itemId)}
                  value={orderAllocations[String(line.id)] ?? []}
                  onChange={stocks =>
                    setOrderAllocations(current => ({ ...current, [String(line.id)]: stocks }))
                  }
                />
              </Card>
            ))}
        </FormSection>

        <Divider />

        <FormSection title="Direct Lines (not on a sales order)">
          {directLines.map(line => (
            <Card key={line.key} size="small" style={{ marginBottom: 12 }}>
              <Row gutter={12} align="middle" style={{ marginBottom: 8 }}>
                <Col xs={24} md={12}>
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
                <Col xs={12} md={4}>
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
                <Col xs={12} md={2}>
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
                { key: `direct-${Date.now()}`, rate: 0, stocks: [] },
              ])
            }
          >
            Add Direct Line
          </Button>
        </FormSection>
      </Card>
    </div>
  )
}

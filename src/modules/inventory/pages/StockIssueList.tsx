import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Tag,
} from 'antd'
import type { FormListFieldData, TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { useEmployees } from '@/modules/hr/hooks/useEmployees'
import { useProcurementItems } from '@/modules/procurement/hooks/useProcurementItems'
import type { ProcurementItemOption } from '@/modules/procurement/hooks/useProcurementItems'
import type { StockIssue } from '@/types/inventory'
import { useLocations } from '../hooks/useLocations'
import { useAllStockIssues, useCreateDirectStockIssue } from '../hooks/useStockIssues'
import { getErrorMessage } from '@/api/client'

interface DirectIssueLineValues {
  itemId: string
  storeLocationId: string
  batchNo?: string
  heatNo?: string
  issuedQty: number
}

const getColumns = (): TableColumnsType<StockIssue> => [
  { title: 'Date', dataIndex: 'issueDate', key: 'issueDate', width: 120, render: v => v ?? '—' },
  {
    title: 'Source',
    dataIndex: 'source',
    key: 'source',
    width: 110,
    render: (v: StockIssue['source']) =>
      v === 'DIRECT' ? <Tag color="blue">Direct</Tag> : <Tag color="green">Requisition</Tag>,
  },
  { title: 'Item', dataIndex: 'itemName', key: 'itemName', render: v => v ?? '—' },
  {
    title: 'Location',
    dataIndex: 'storeLocationName',
    key: 'storeLocationName',
    render: v => v ?? '—',
  },
  {
    title: 'Batch / Heat',
    key: 'batchHeat',
    render: (_, r) => `${r.batchNo ?? '—'} / ${r.heatNo ?? '—'}`,
  },
  { title: 'Qty', dataIndex: 'issuedQty', key: 'issuedQty', align: 'right', width: 90 },
  { title: 'Issued By', dataIndex: 'issuedByName', key: 'issuedByName', render: v => v ?? '—' },
  { title: 'Issued To', dataIndex: 'issuedToName', key: 'issuedToName', render: v => v ?? '—' },
]

export const StockIssueList: FC = () => {
  const [itemId, setItemId] = useState<string | undefined>()
  const [locationId, setLocationId] = useState<string | undefined>()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: items, isLoading: loadingItems } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: issues, isLoading } = useAllStockIssues({
    item_id: itemId ? Number(itemId) : undefined,
    location_id: locationId ? Number(locationId) : undefined,
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Stock Issue"
        subtitle="Material issued from inventory — against a requisition or direct"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Stock Issue' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Direct Issue
          </Button>
        }
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              showSearch
              allowClear
              placeholder="Filter by item"
              style={{ width: '100%' }}
              loading={loadingItems}
              value={itemId}
              onChange={setItemId}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
              options={items.map(item => ({
                value: item.id,
                label: `${item.code} — ${item.name}`,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Filter by location"
              style={{ width: '100%' }}
              value={locationId}
              onChange={setLocationId}
              options={locations.map(l => ({ value: l.id, label: l.name }))}
            />
          </Col>
        </Row>
      </PageHeader>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{
          body: { flex: 1, minHeight: 0, padding: 0, display: 'flex', flexDirection: 'column' },
        }}
      >
        <DataTable<StockIssue>
          columns={getColumns()}
          dataSource={issues}
          rowKey="id"
          loading={isLoading}
          totalLabel="issues"
          fillHeight
        />
      </Card>

      {modalOpen && <DirectIssueModal onClose={() => setModalOpen(false)} />}
    </div>
  )
}

const DirectIssueModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data: items } = useProcurementItems()
  const { data: locations } = useLocations()
  const { data: employees } = useEmployees()
  const { mutateAsync: createDirectIssue, isPending } = useCreateDirectStockIssue()

  const itemOptions = items.map(i => ({ label: `${i.code} — ${i.name}`, value: i.id }))
  const locationOptions = locations.map(l => ({ label: l.name, value: l.id }))
  const employeeOptions = (employees ?? []).map(e => ({ label: e.fullName, value: e.id }))

  const handleFinish = async (values: {
    issuedTo: string
    issueDate?: dayjs.Dayjs
    lines: DirectIssueLineValues[]
  }) => {
    try {
      await createDirectIssue({
        issued_to: Number(values.issuedTo),
        issue_date: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : undefined,
        lines: values.lines.map(line => ({
          item_id: Number(line.itemId),
          store_location_id: Number(line.storeLocationId),
          batch_no: line.batchNo ?? null,
          heat_no: line.heatNo ?? null,
          issued_qty: line.issuedQty,
        })),
      })
      message.success('Stock issued')
      onClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <Modal
      title="Direct Issue"
      open
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      width={800}
      okText="Issue"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ lines: [{}] }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Issued To"
              name="issuedTo"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                placeholder="Select employee"
                options={employeeOptions}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Issue Date" name="issueDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.List name="lines">
          {(fields, { add, remove }) => (
            <>
              {fields.map(field => (
                <DirectIssueLineRow
                  key={field.key}
                  field={field}
                  itemOptions={itemOptions}
                  locationOptions={locationOptions}
                  items={items}
                  onRemove={fields.length > 1 ? () => remove(field.name) : undefined}
                />
              ))}
              <Button icon={<PlusOutlined />} onClick={() => add()} style={{ width: '100%' }}>
                Add Line
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}

interface DirectIssueLineRowProps {
  field: FormListFieldData
  itemOptions: { label: string; value: string }[]
  locationOptions: { label: string; value: string }[]
  items: ProcurementItemOption[]
  onRemove?: () => void
}

const DirectIssueLineRow: FC<DirectIssueLineRowProps> = ({
  field,
  itemOptions,
  locationOptions,
  items,
  onRemove,
}) => {
  const selectedItemId = Form.useWatch(['lines', field.name, 'itemId']) as string | undefined
  const selectedItem = items.find(i => i.id === selectedItemId)

  return (
    <Row gutter={8} align="top">
      <Col span={7}>
        <Form.Item name={[field.name, 'itemId']} rules={[{ required: true, message: 'Required' }]}>
          <Select
            placeholder="Item"
            options={itemOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Col>
      <Col span={5}>
        <Form.Item
          name={[field.name, 'storeLocationId']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <Select placeholder="Store location" options={locationOptions} showSearch />
        </Form.Item>
      </Col>
      <Col span={4}>
        <Form.Item
          name={[field.name, 'batchNo']}
          rules={selectedItem?.batchTracking ? [{ required: true, message: 'Required' }] : []}
        >
          <Input placeholder="Batch No" />
        </Form.Item>
      </Col>
      <Col span={4}>
        <Form.Item
          name={[field.name, 'heatNo']}
          rules={selectedItem?.heatTracking ? [{ required: true, message: 'Required' }] : []}
        >
          <Input placeholder="Heat No" />
        </Form.Item>
      </Col>
      <Col span={3}>
        <Form.Item
          name={[field.name, 'issuedQty']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber placeholder="Qty" min={0.001} style={{ width: '100%' }} />
        </Form.Item>
      </Col>
      <Col span={1}>
        {onRemove && <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemove} />}
      </Col>
    </Row>
  )
}

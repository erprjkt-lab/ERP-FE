import { App, Col, Form, InputNumber, Row, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { useVendors } from '@/modules/masters/hooks/useVendors'
import type { ChallanRequest } from '@/types/production'
import { useCreateChallan } from '../hooks/useJobCardChallans'

export interface CreateChallanModalProps {
  open: boolean
  onClose: () => void
  requests: ChallanRequest[]
  jobCardLabel: (jobCardId: string) => string
}

interface ChallanFormValues {
  challanDate: { format: (fmt: string) => string }
  destinationPartyId: string
}

export const CreateChallanModal: FC<CreateChallanModalProps> = ({
  open,
  onClose,
  requests,
  jobCardLabel,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<ChallanFormValues>()
  const { data: vendors = [] } = useVendors()
  const { mutateAsync: createChallan, isPending } = useCreateChallan()

  const [dispatchQty, setDispatchQty] = useState<Record<string, number>>({})
  const [rate, setRate] = useState<Record<string, number | undefined>>({})

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ challanDate: dayjs() } as Partial<ChallanFormValues>)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Reset the per-row qty/rate state whenever the modal opens for a new
  // selection. Adjusted during render (React's recommended pattern for
  // resetting state on a prop change) rather than in the effect above,
  // since these are plain useState setters, not the Form instance's own
  // (non-React) state.
  const [trackedOpen, setTrackedOpen] = useState(open)
  if (open !== trackedOpen) {
    setTrackedOpen(open)
    if (open) {
      setDispatchQty(Object.fromEntries(requests.map(r => [r.id, r.pendingQty])))
      setRate({})
    }
  }

  const handleOk = async () => {
    let values: ChallanFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const items = requests
      .map(request => ({
        challan_request_id: Number(request.id),
        dispatched_qty: dispatchQty[request.id] ?? 0,
        rate: rate[request.id] ?? null,
      }))
      .filter(item => item.dispatched_qty > 0)

    if (items.length === 0) {
      message.error('Enter a dispatch quantity for at least one request')
      return
    }

    try {
      const result = await createChallan({
        challan_date: values.challanDate.format('YYYY-MM-DD'),
        destination_party_id: Number(values.destinationPartyId),
        items,
      })
      message.success(`Challan ${result.data.challan_number} created`)
      onClose()
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const columns: TableColumnsType<ChallanRequest> = [
    { title: 'Job Card', key: 'jobCard', render: (_, r) => jobCardLabel(r.jobCardId) },
    { title: 'Process', dataIndex: 'processName', key: 'processName' },
    { title: 'Pending', dataIndex: 'pendingQty', key: 'pendingQty', width: 90 },
    {
      title: 'Dispatch Qty',
      key: 'dispatchQty',
      width: 140,
      render: (_, r) => (
        <InputNumber
          size="small"
          min={0}
          max={r.pendingQty}
          value={dispatchQty[r.id]}
          style={{ width: '100%' }}
          onChange={value => setDispatchQty(prev => ({ ...prev, [r.id]: value ?? 0 }))}
        />
      ),
    },
    {
      title: 'Rate',
      key: 'rate',
      width: 120,
      render: (_, r) => (
        <InputNumber
          size="small"
          min={0}
          placeholder="Optional"
          value={rate[r.id]}
          style={{ width: '100%' }}
          onChange={value => setRate(prev => ({ ...prev, [r.id]: value ?? undefined }))}
        />
      ),
    },
  ]

  return (
    <Modal
      title="Create Challan"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Create Challan"
      confirmLoading={isPending}
      width={780}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <FormField
              label="Challan Date"
              name="challanDate"
              fieldType="date"
              rules={[{ required: true, message: 'Challan date is required' }]}
            />
          </Col>
          <Col xs={24} sm={16}>
            <FormField
              label="Destination Vendor"
              name="destinationPartyId"
              fieldType="select"
              options={vendors.map(vendor => ({ label: vendor.name, value: vendor.id }))}
              rules={[{ required: true, message: 'Vendor is required' }]}
            />
          </Col>
        </Row>
      </Form>

      <Table<ChallanRequest>
        columns={columns}
        dataSource={requests}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </Modal>
  )
}

import { App, Col, Form, InputNumber, Row, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormField } from '@/components/ui/FormField'
import { useVendors } from '@/modules/masters/hooks/useVendors'
import type { ChallanRequest } from '@/types/production'
import { useCreateChallan } from '../hooks/useJobCardChallans'
import { getErrorMessage } from '@/api/client'
import { deferMount } from '@/components/ui/deferMount'

export interface CreateChallanDrawerProps {
  open: boolean
  onClose: () => void
  /** Every pending request, so several can go out on one vendor challan. */
  requests: ChallanRequest[]
  /** The row the user acted on — its full pending qty is filled in up front. */
  seedRequestId?: string
  jobCardLabel: (jobCardId: string) => string
}

interface ChallanFormValues {
  challanDate: { format: (fmt: string) => string }
  destinationPartyId: string
}

const CreateChallanDrawerInner: FC<CreateChallanDrawerProps> = ({
  open,
  onClose,
  requests,
  seedRequestId,
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

  // Only the row that was acted on starts with a quantity; the rest sit at 0 and
  // are left out of the payload unless the user types one. That is the whole
  // bundling mechanism — no extra selection UI needed. Adjusted during render
  // (React's pattern for resetting state on a prop change) rather than in the
  // effect above, since these are plain useState setters.
  const [trackedSeed, setTrackedSeed] = useState<string | undefined>()
  if (open && seedRequestId !== trackedSeed) {
    setTrackedSeed(seedRequestId)
    const seeded = requests.find(request => request.id === seedRequestId)
    setDispatchQty(seeded ? { [seeded.id]: seeded.pendingQty } : {})
    setRate({})
  }
  if (!open && trackedSeed !== undefined) {
    setTrackedSeed(undefined)
  }

  const items = requests
    .map(request => ({
      challan_request_id: Number(request.id),
      dispatched_qty: dispatchQty[request.id] ?? 0,
      rate: rate[request.id] ?? null,
    }))
    .filter(item => item.dispatched_qty > 0)

  const handleSubmit = async () => {
    let values: ChallanFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

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
      message.error(getErrorMessage(error))
    }
  }

  const columns: TableColumnsType<ChallanRequest> = [
    { title: 'Job Card', key: 'jobCard', render: (_, r) => jobCardLabel(r.jobCardId) },
    { title: 'Process', dataIndex: 'processName', key: 'processName' },
    { title: 'Pending', dataIndex: 'pendingQty', key: 'pendingQty', width: 90 },
    {
      title: 'Dispatch Qty',
      key: 'dispatchQty',
      width: 130,
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
      width: 110,
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
    <FormDrawer
      title="Create Outsource Challan"
      open={open}
      onClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitText={items.length > 1 ? `Create Challan (${items.length} items)` : 'Create Challan'}
      submitting={isPending}
      submitDisabled={items.length === 0}
      width={760}
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

      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        One challan can carry work from several job cards to the same vendor — give any other
        pending request below a dispatch quantity to add it.
      </Typography.Text>

      <DataTable<ChallanRequest>
        columns={columns}
        dataSource={requests}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No pending outsource requests' }}
      />
    </FormDrawer>
  )
}

export const CreateChallanDrawer = deferMount(CreateChallanDrawerInner)

import { App, Col, Form, InputNumber, Row, Space, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import type { JobCardMovement } from '@/types/production'
import { useAcceptMovement } from '../hooks/useJobCardMovements'
import type { StepProgress } from '../utils/jobCardProgress'

export interface AcceptProductionModalProps {
  open: boolean
  onClose: () => void
  jobCardId: string
  step?: StepProgress
  /** Every movement into this step. */
  movements: JobCardMovement[]
}

interface AcceptFormValues {
  acceptedQty: number
  shortQty?: number
}

function outstandingOf(movement: JobCardMovement): number {
  const settled = movement.acceptances.reduce(
    (sum, acceptance) => sum + acceptance.acceptedQty + acceptance.shortQty,
    0,
  )
  return Math.max(movement.movedQty - settled, 0)
}

export const AcceptProductionModal: FC<AcceptProductionModalProps> = ({
  open,
  onClose,
  jobCardId,
  step,
  movements,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<AcceptFormValues>()
  const { mutateAsync: acceptMovement, isPending } = useAcceptMovement(jobCardId)

  const pendingQty = step?.unacceptedQty ?? 0
  const acceptedQty = Form.useWatch('acceptedQty', form) as number | undefined
  const shortQty = Form.useWatch('shortQty', form) as number | undefined
  const unaccounted = pendingQty - (acceptedQty ?? 0) - (shortQty ?? 0)

  useEffect(() => {
    if (open) form.setFieldsValue({ acceptedQty: pendingQty, shortQty: undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingQty])

  const handleOk = async () => {
    let values: AcceptFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const total = values.acceptedQty + (values.shortQty ?? 0)
    if (total <= 0) {
      message.error('Enter a quantity to accept')
      return
    }
    if (total > pendingQty) {
      message.error(`Only ${pendingQty} is waiting to be accepted at this process`)
      return
    }

    // Acceptances post against a movement; the backend pools them across the
    // from/to process pair, so settling the oldest open movement is safe.
    const target = [...movements].reverse().find(movement => outstandingOf(movement) > 0)
    if (!target) {
      message.error('Nothing is waiting to be accepted at this process')
      return
    }

    try {
      await acceptMovement({
        movementId: target.id,
        payload: { accepted_qty: values.acceptedQty, short_qty: values.shortQty ?? 0 },
      })
      message.success(`Accepted ${values.acceptedQty} into ${step?.step.processName ?? 'process'}`)
      onClose()
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const columns: TableColumnsType<JobCardMovement> = [
    {
      title: 'Date',
      dataIndex: 'movedAt',
      key: 'movedAt',
      width: 110,
      render: value => String(value).slice(0, 10),
    },
    { title: 'From Process', dataIndex: 'fromProcessName', key: 'fromProcessName' },
    { title: 'Moved', dataIndex: 'movedQty', key: 'movedQty', width: 90 },
    {
      title: 'Accepted',
      key: 'accepted',
      width: 100,
      render: (_, record) =>
        record.acceptances.reduce((sum, acceptance) => sum + acceptance.acceptedQty, 0),
    },
    {
      title: 'Outstanding',
      key: 'outstanding',
      width: 110,
      render: (_, record) => outstandingOf(record),
    },
  ]

  return (
    <Modal
      title={
        <Space wrap>
          <span>Accept for Production</span>
          {step && <Tag color="blue">{step.step.processName}</Tag>}
          <Tag color={pendingQty > 0 ? 'orange' : 'default'}>Pending: {pendingQty}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Save"
      confirmLoading={isPending}
      okButtonProps={{ disabled: pendingQty <= 0 }}
      width={680}
    >
      <Typography.Paragraph type="secondary">
        {step
          ? `Confirm how much of the material that arrived at ${step.step.processName} you are taking in for production.`
          : ''}
      </Typography.Paragraph>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Accept Qty"
              name="acceptedQty"
              rules={[{ required: true, message: 'Accept quantity is required' }]}
            >
              <InputNumber
                size="large"
                min={0}
                max={pendingQty}
                style={{ width: '100%' }}
                onChange={value => {
                  const accepted = value ?? 0
                  const currentShort = form.getFieldValue('shortQty') ?? 0
                  if (accepted + currentShort > pendingQty) {
                    form.setFieldValue('shortQty', Math.max(pendingQty - accepted, 0))
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Short Qty"
              name="shortQty"
              tooltip="Qty that arrived short or damaged"
            >
              <InputNumber
                size="large"
                min={0}
                max={pendingQty}
                style={{ width: '100%' }}
                onChange={value => {
                  const short = value ?? 0
                  const currentAccepted = form.getFieldValue('acceptedQty') ?? 0
                  if (currentAccepted + short > pendingQty) {
                    form.setFieldValue('acceptedQty', Math.max(pendingQty - short, 0))
                  }
                }}
              />
            </Form.Item>
          </Col>
        </Row>
        {pendingQty > 0 && (
          <Typography.Text
            type={unaccounted > 0 ? 'warning' : 'secondary'}
            style={{ fontSize: 12 }}
          >
            {unaccounted > 0
              ? `${unaccounted} of ${pendingQty} still unaccounted for.`
              : `All ${pendingQty} accounted for.`}
          </Typography.Text>
        )}
      </Form>

      <Typography.Title level={5}>Movements into this process</Typography.Title>
      <DataTable<JobCardMovement>
        columns={columns}
        dataSource={movements}
        rowKey="id"
        pagination={false}
        size="small"
        totalLabel="movements"
      />
    </Modal>
  )
}

import { App, Form, InputNumber, Space, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import type { JobCardMovement } from '@/types/production'
import { useCreateMovement } from '../hooks/useJobCardMovements'
import type { StepProgress } from '../utils/jobCardProgress'

export interface MoveForwardModalProps {
  open: boolean
  onClose: () => void
  jobCardId: string
  step?: StepProgress
  nextStep?: StepProgress
  /** Movements already sent out of this step. */
  movements: JobCardMovement[]
}

interface MoveFormValues {
  movedQty: number
}

export const MoveForwardModal: FC<MoveForwardModalProps> = ({
  open,
  onClose,
  jobCardId,
  step,
  nextStep,
  movements,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<MoveFormValues>()
  const { mutateAsync: createMovement, isPending } = useCreateMovement(jobCardId)

  const readyQty = step?.readyToMoveQty ?? 0

  useEffect(() => {
    if (open) form.setFieldsValue({ movedQty: readyQty })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, readyQty])

  const handleOk = async () => {
    let values: MoveFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    if (!step || !nextStep) return

    if (values.movedQty <= 0) {
      message.error('Enter a quantity to move')
      return
    }
    if (values.movedQty > readyQty) {
      message.error(`Only ${readyQty} OK qty is available to move from this process`)
      return
    }

    try {
      await createMovement({
        from_process_id: Number(step.step.processId),
        to_process_id: Number(nextStep.step.processId),
        moved_qty: values.movedQty,
      })
      message.success(`Moved ${values.movedQty} to ${nextStep.step.processName}`)
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
    { title: 'To Process', dataIndex: 'toProcessName', key: 'toProcessName' },
    { title: 'Moved', dataIndex: 'movedQty', key: 'movedQty', width: 90 },
    {
      title: 'Accepted',
      key: 'accepted',
      width: 100,
      render: (_, record) =>
        record.acceptances.reduce((sum, acceptance) => sum + acceptance.acceptedQty, 0),
    },
  ]

  return (
    <Modal
      title={
        <Space wrap>
          <span>Move to Next Process</span>
          <Tag color={readyQty > 0 ? 'green' : 'default'}>Ready: {readyQty}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Save"
      confirmLoading={isPending}
      okButtonProps={{ disabled: readyQty <= 0 }}
      width={620}
    >
      <Typography.Paragraph type="secondary">
        {step && nextStep
          ? `Send the OK quantity produced at ${step.step.processName} on to ${nextStep.step.processName}. It waits there to be accepted before work can start.`
          : 'This is the final process — OK quantity goes straight to finished-goods stock.'}
      </Typography.Paragraph>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Move Qty"
          name="movedQty"
          rules={[{ required: true, message: 'Quantity is required' }]}
        >
          <InputNumber size="large" min={0} max={readyQty} style={{ width: '100%' }} />
        </Form.Item>
      </Form>

      {movements.length > 0 && (
        <>
          <Typography.Title level={5}>Already moved out</Typography.Title>
          <DataTable<JobCardMovement>
            columns={columns}
            dataSource={movements}
            rowKey="id"
            pagination={false}
            size="small"
            totalLabel="movements"
          />
        </>
      )}
    </Modal>
  )
}

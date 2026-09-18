import { App, Descriptions, Form, InputNumber, Space, Tag } from 'antd'
import type { FC } from 'react'
import { useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useCreateChallanRequest } from '../hooks/useChallanRequests'
import type { StepProgress } from '../utils/jobCardProgress'

export interface RequestOutsourceModalProps {
  open: boolean
  onClose: () => void
  jobCardId: string
  step?: StepProgress
}

interface RequestFormValues {
  requestedQty: number
}

export const RequestOutsourceModal: FC<RequestOutsourceModalProps> = ({
  open,
  onClose,
  jobCardId,
  step,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<RequestFormValues>()
  const { mutateAsync: createRequest, isPending } = useCreateChallanRequest(jobCardId)

  const pendingQty = step?.pendingQty ?? 0

  useEffect(() => {
    if (open) form.setFieldsValue({ requestedQty: pendingQty > 0 ? pendingQty : undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step?.step.processId])

  const handleOk = async () => {
    let values: RequestFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    if (!step) return

    try {
      await createRequest({
        process_id: Number(step.step.processId),
        requested_qty: values.requestedQty,
      })
      message.success(
        `Outsource request raised for ${values.requestedQty} at ${step.step.processName}`,
      )
      form.resetFields()
      onClose()
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <Modal
      title={
        <Space wrap>
          <span>Request Outsource</span>
          {step && <Tag color="blue">{step.step.processName}</Tag>}
        </Space>
      }
      open={open}
      onCancel={() => {
        form.resetFields()
        onClose()
      }}
      onOk={handleOk}
      okText="Raise Request"
      confirmLoading={isPending}
      okButtonProps={{ disabled: pendingQty <= 0 }}
      width={480}
    >
      <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Pending at this process">{pendingQty}</Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Quantity to send out"
          name="requestedQty"
          rules={[
            { required: true, message: 'Quantity is required' },
            {
              validator: (_, value) =>
                value > 0
                  ? Promise.resolve()
                  : Promise.reject(new Error('Quantity must be greater than zero')),
            },
          ]}
        >
          <InputNumber size="large" min={0} max={pendingQty} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

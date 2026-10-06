import { App, Col, Descriptions, Form, InputNumber, Row, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import type { Challan, ChallanItem } from '@/types/production'
import { useCreateProcessLog } from '../hooks/useProcessLogs'
import { getErrorMessage } from '@/api/client'

export interface AcceptChallanItemModalProps {
  open: boolean
  onClose: () => void
  challan?: Challan
  item?: ChallanItem
  jobCardLabel: string
}

interface AcceptFormValues {
  logDate: { format: (fmt: string) => string }
  okQty: number
  rejectedQty?: number
  remark?: string
}

export const AcceptChallanItemModal: FC<AcceptChallanItemModalProps> = ({
  open,
  onClose,
  challan,
  item,
  jobCardLabel,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<AcceptFormValues>()
  const { mutateAsync: createLog, isPending } = useCreateProcessLog(item?.jobCardId)

  const outstandingQty = item?.outstandingQty ?? 0

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        logDate: dayjs(),
        okQty: outstandingQty > 0 ? outstandingQty : undefined,
      } as Partial<AcceptFormValues>)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id])

  const handleOk = async () => {
    let values: AcceptFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    if (!item || !challan) return

    try {
      await createLog({
        process_id: Number(item.processId),
        performed_by_type: 2,
        processor_party_id: Number(challan.destinationPartyId),
        log_date: values.logDate.format('YYYY-MM-DD'),
        ok_qty: values.okQty,
        rejected_qty: values.rejectedQty ?? 0,
        inbound_challan_item_id: Number(item.id),
        remark: values.remark || undefined,
      })
      message.success(`Accepted ${values.okQty} back from ${challan.destinationPartyName}`)
      onClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  return (
    <Modal
      title={
        <Space wrap>
          <span>Accept from Vendor</span>
          {item && <Tag color="blue">{item.processName}</Tag>}
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Accept"
      confirmLoading={isPending}
      okButtonProps={{
        disabled:
          outstandingQty <= 0 ||
          (Number(item?.receivedQty) >= Number(item?.dispatchedQty) &&
            Number(item?.dispatchedQty) > 0) ||
          challan?.status === 'closed',
      }}
      width={620}
    >
      <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Job Card">{jobCardLabel}</Descriptions.Item>
        <Descriptions.Item label="Vendor">{challan?.destinationPartyName}</Descriptions.Item>
        <Descriptions.Item label="Dispatched">{item?.dispatchedQty}</Descriptions.Item>
        <Descriptions.Item label="Outstanding">{outstandingQty}</Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <FormField
              label="Date"
              name="logDate"
              fieldType="date"
              rules={[{ required: true, message: 'Date is required' }]}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item
              label="OK Qty"
              name="okQty"
              rules={[
                { required: true, message: 'OK qty is required' },
                {
                  validator: (_, value) =>
                    value > 0 && value <= outstandingQty
                      ? Promise.resolve()
                      : Promise.reject(new Error(`Must be between 1 and ${outstandingQty}`)),
                },
              ]}
            >
              <InputNumber size="large" min={0} max={outstandingQty} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Rejected Qty" name="rejectedQty">
              <InputNumber size="large" min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <FormField label="Remark" name="remark" fieldType="textarea" />
      </Form>
    </Modal>
  )
}

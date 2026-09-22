import { App, Col, Descriptions, Form, InputNumber, Row, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { useEmployees } from '@/modules/hr/hooks/useEmployees'
import { useShifts } from '@/modules/hr/hooks/useShifts'
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
  operatorId: string
  shiftId: string
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
  const { data: employees = [] } = useEmployees()
  const { data: shifts = [] } = useShifts()
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

  const employeeOptions = employees.map(emp => ({ label: emp.fullName, value: emp.id }))

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
        operator_id: Number(values.operatorId),
        shift_id: Number(values.shiftId),
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
      okButtonProps={{ disabled: outstandingQty <= 0 }}
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
        <Row gutter={16}>
          <Col xs={12} sm={12}>
            <FormField
              label="Operator"
              name="operatorId"
              fieldType="select"
              options={employeeOptions}
              rules={[{ required: true, message: 'Operator is required' }]}
            />
          </Col>
          <Col xs={12} sm={12}>
            <FormField
              label="Shift"
              name="shiftId"
              fieldType="select"
              options={shifts.map(shift => ({ label: shift.name, value: shift.id }))}
              rules={[{ required: true, message: 'Shift is required' }]}
            />
          </Col>
        </Row>
        <FormField label="Remark" name="remark" fieldType="textarea" />
      </Form>
    </Modal>
  )
}

import { Alert, App, Col, Form, InputNumber, Radio, Row, Space, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { useEmployees } from '@/modules/hr/hooks/useEmployees'
import { useShifts } from '@/modules/hr/hooks/useShifts'
import { useVendors } from '@/modules/masters/hooks/useVendors'
import type { ProcessLog } from '@/types/production'
import { useCreateProcessLog } from '../hooks/useProcessLogs'
import type { StepProgress } from '../utils/jobCardProgress'

export interface LogProductionModalProps {
  open: boolean
  onClose: () => void
  jobCardId: string
  step?: StepProgress
  logs: ProcessLog[]
  nextProcessName?: string
  outputLocationName?: string
  hasMaterialIssued: boolean
}

interface LogFormValues {
  logDate: { format: (fmt: string) => string }
  productionQty: number
  okQty: number
  bypassedQty?: number
  productionMinutes?: number
  downtimeMinutes?: number
  performedByType: 'in_house' | 'outsourced'
  processorEmployeeId?: string
  processorPartyId?: string
  operatorId: string
  shiftId: string
  remark?: string
}

export const LogProductionModal: FC<LogProductionModalProps> = ({
  open,
  onClose,
  jobCardId,
  step,
  logs,
  nextProcessName,
  outputLocationName,
  hasMaterialIssued,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<LogFormValues>()

  const { data: employees = [] } = useEmployees()
  const { data: shifts = [] } = useShifts()
  const { data: vendors = [] } = useVendors()
  const { mutateAsync: createLog, isPending } = useCreateProcessLog(jobCardId)

  const productionQty = Form.useWatch('productionQty', form) ?? 0
  const okQty = Form.useWatch('okQty', form) ?? 0
  const bypassedQty = Form.useWatch('bypassedQty', form) ?? 0
  const performedByType = Form.useWatch('performedByType', form) ?? 'in_house'

  const pendingQty = step?.pendingQty ?? 0
  const rejectedQty = Math.max(productionQty - okQty - bypassedQty, 0)
  const overPending = productionQty > pendingQty
  const overSplit = okQty + bypassedQty > productionQty
  const blockedOnMaterial = Boolean(step?.isFirst) && !hasMaterialIssued

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        logDate: dayjs(),
        performedByType: 'in_house',
      } as Partial<LogFormValues>)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step?.step.processId])

  const handleOk = async () => {
    let values: LogFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    if (!step) return

    if (overSplit) {
      message.error('OK + bypassed quantity cannot exceed the production quantity')
      return
    }
    if (overPending) {
      message.error(`Only ${pendingQty} is pending at this process`)
      return
    }

    try {
      await createLog({
        process_id: Number(step.step.processId),
        performed_by_type: values.performedByType === 'outsourced' ? 2 : 1,
        processor_employee_id:
          values.performedByType === 'in_house' ? Number(values.processorEmployeeId) : null,
        processor_party_id:
          values.performedByType === 'outsourced' ? Number(values.processorPartyId) : null,
        operator_id: Number(values.operatorId),
        shift_id: Number(values.shiftId),
        log_date: values.logDate.format('YYYY-MM-DD'),
        ok_qty: values.okQty,
        rejected_qty: rejectedQty,
        bypassed_qty: values.bypassedQty ?? 0,
        production_seconds: values.productionMinutes ? values.productionMinutes * 60 : null,
        downtime_seconds: values.downtimeMinutes ? values.downtimeMinutes * 60 : null,
        remark: values.remark || undefined,
      })
      message.success(`Logged ${productionQty} at ${step.step.processName}`)
      onClose()
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const employeeOptions = employees.map(emp => ({ label: emp.fullName, value: emp.id }))
  const stepLogs = logs.filter(entry => entry.processId === step?.step.processId)

  const columns: TableColumnsType<ProcessLog> = [
    { title: 'Date', dataIndex: 'logDate', key: 'logDate', width: 110 },
    { title: 'OK', dataIndex: 'okQty', key: 'okQty', width: 70 },
    { title: 'Rejected', dataIndex: 'rejectedQty', key: 'rejectedQty', width: 90 },
    { title: 'Operator', dataIndex: 'operatorName', key: 'operatorName' },
    { title: 'Shift', dataIndex: 'shiftName', key: 'shiftName', width: 100 },
  ]

  return (
    <Modal
      title={
        <Space wrap>
          <span>Log Production</span>
          {step && <Tag color="blue">{step.step.processName}</Tag>}
          <Tag color={pendingQty > 0 ? 'orange' : 'default'}>Pending: {pendingQty}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Save"
      confirmLoading={isPending}
      okButtonProps={{ disabled: blockedOnMaterial || pendingQty <= 0 }}
      width={880}
    >
      {blockedOnMaterial && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Issue material first"
          description="The first process cannot be logged until material has been issued for this job card."
        />
      )}

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
              label="Production Qty"
              name="productionQty"
              rules={[{ required: true, message: 'Production qty is required' }]}
            >
              <InputNumber size="large" min={0} max={pendingQty} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item
              label="OK Qty"
              name="okQty"
              rules={[{ required: true, message: 'OK qty is required' }]}
            >
              <InputNumber size="large" min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Rejected Qty">
              <InputNumber
                size="large"
                value={rejectedQty}
                readOnly
                style={{ width: '100%' }}
                variant="filled"
              />
            </Form.Item>
          </Col>
        </Row>

        <Alert
          type={overPending || overSplit ? 'error' : 'info'}
          style={{ marginBottom: 16 }}
          message={
            overSplit
              ? 'OK + bypassed cannot be more than the production quantity'
              : overPending
                ? `Only ${pendingQty} is pending at this process`
                : `${productionQty} produced — ${okQty} OK, ${rejectedQty} rejected`
          }
          description={
            !overPending && !overSplit && okQty > 0 ? (
              step?.isLast ? (
                <span>
                  {okQty} OK will be received into stock at{' '}
                  <strong>{outputLocationName || 'the output location'}</strong>
                </span>
              ) : (
                <span>
                  {okQty} OK can then be moved on to{' '}
                  <strong>{nextProcessName ?? 'the next process'}</strong>
                </span>
              )
            ) : undefined
          }
        />

        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Form.Item label="Bypassed Qty" name="bypassedQty" tooltip="Qty skipping this process">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Production Time (min)" name="productionMinutes">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Down Time (min)" name="downtimeMinutes">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={6}>
            <Form.Item label="Process By" name="performedByType">
              <Radio.Group
                options={[
                  { label: 'In-house', value: 'in_house' },
                  { label: 'Outsourced', value: 'outsourced' },
                ]}
                optionType="button"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {performedByType === 'outsourced' ? (
            <Col xs={24} sm={8}>
              <FormField
                label="Vendor"
                name="processorPartyId"
                fieldType="select"
                options={vendors.map(vendor => ({ label: vendor.name, value: vendor.id }))}
                rules={[{ required: true, message: 'Vendor is required' }]}
              />
            </Col>
          ) : (
            <Col xs={24} sm={8}>
              <FormField
                label="Processed By"
                name="processorEmployeeId"
                fieldType="select"
                options={employeeOptions}
                rules={[{ required: true, message: 'Processor is required' }]}
              />
            </Col>
          )}
          <Col xs={24} sm={8}>
            <FormField
              label="Operator"
              name="operatorId"
              fieldType="select"
              options={employeeOptions}
              rules={[{ required: true, message: 'Operator is required' }]}
            />
          </Col>
          <Col xs={24} sm={8}>
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

      {stepLogs.length > 0 && (
        <>
          <Typography.Title level={5}>Entries at this process</Typography.Title>
          <DataTable<ProcessLog>
            columns={columns}
            dataSource={stepLogs}
            rowKey="id"
            pagination={false}
            size="small"
            totalLabel="entries"
          />
        </>
      )}
    </Modal>
  )
}

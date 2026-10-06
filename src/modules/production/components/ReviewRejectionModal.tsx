import { App, Form, Input, InputNumber, Select } from 'antd'
import type { FC } from 'react'
import { useEffect, useMemo } from 'react'
import { getErrorMessage } from '@/api/client'
import { Modal } from '@/components/ui/Modal'
import { useMachines } from '@/modules/masters/hooks/useMachines'
import type {
  JobCardRouteStep,
  Rejection,
  RejectionDecision,
  RejectionOrigin,
} from '@/types/production'
import { useCreateRejectionReview, useRejectionReasons } from '../hooks/useRejections'

export interface ReviewRejectionModalProps {
  open: boolean
  onClose: () => void
  rejection?: Rejection
  jobCardRoutes: JobCardRouteStep[]
}

interface ReviewFormValues {
  reviewedQty: number
  decision: RejectionDecision
  reasonId: string
  originType?: RejectionOrigin
  machineId?: string
  reworkProcessId?: string
  remark?: string
}

const DECISION_OPTIONS = [
  { label: 'Reject (scrap)', value: 'REJECT' },
  { label: 'Rework', value: 'REWORK' },
]

const ORIGIN_OPTIONS = [
  { label: 'Inhouse — a machine produced the defect', value: 'INHOUSE' },
  { label: 'Outsource — came back defective from a vendor', value: 'OUTSOURCE' },
]

export const ReviewRejectionModal: FC<ReviewRejectionModalProps> = ({
  open,
  onClose,
  rejection,
  jobCardRoutes,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<ReviewFormValues>()
  const { data: reasons } = useRejectionReasons({ status: 1 })
  const { data: machines = [] } = useMachines()
  const { mutateAsync: createReview, isPending } = useCreateRejectionReview(rejection?.id)

  const decision = Form.useWatch('decision', form)
  const originType = Form.useWatch('originType', form)

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ reviewedQty: rejection?.pendingQty })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rejection?.id])

  const reasonOptions = reasons
    .filter(r => r.type === decision)
    .map(r => ({ label: r.reason, value: r.id }))

  // Rework can only send qty back to the rejection's own process or an
  // earlier step in the route — never forward, per RejectionReviewService.
  const rejectionSequenceNo = jobCardRoutes.find(
    step => step.processId === rejection?.processId,
  )?.sequenceNo
  const reworkProcessOptions = useMemo(
    () =>
      jobCardRoutes
        .filter(step => rejectionSequenceNo == null || step.sequenceNo <= rejectionSequenceNo)
        .sort((a, b) => a.sequenceNo - b.sequenceNo)
        .map(step => ({ label: `${step.sequenceNo}. ${step.processName}`, value: step.processId })),
    [jobCardRoutes, rejectionSequenceNo],
  )

  const machineOptions = machines.map(m => ({ label: `${m.code} — ${m.name}`, value: m.id }))

  const handleSubmit = async () => {
    if (!rejection) return
    try {
      const values = await form.validateFields()
      await createReview({
        reviewed_qty: values.reviewedQty,
        decision: values.decision === 'REWORK' ? 2 : 1,
        reason_id: Number(values.reasonId),
        ...(values.decision === 'REJECT'
          ? {
              origin_type: values.originType === 'OUTSOURCE' ? 2 : 1,
              ...(values.originType === 'INHOUSE' ? { machine_id: Number(values.machineId) } : {}),
            }
          : { rework_process_id: Number(values.reworkProcessId) }),
        remark: values.remark || undefined,
      })
      message.success('Rejection review recorded')
      onClose()
    } catch (error) {
      if (error instanceof Error) message.error(getErrorMessage(error))
    }
  }

  return (
    <Modal
      title={rejection ? `Review Rejection — ${rejection.processName}` : 'Review Rejection'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isPending}
      okText="Submit Review"
      width={620}
    >
      {rejection && (
        <Form form={form} layout="vertical">
          <Form.Item
            label={`Reviewed Qty (pending: ${rejection.pendingQty ?? rejection.rejectedQty})`}
            name="reviewedQty"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber
              min={0.001}
              max={rejection.pendingQty ?? rejection.rejectedQty}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Decision"
            name="decision"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select placeholder="Reject or rework?" options={DECISION_OPTIONS} />
          </Form.Item>

          {decision === 'REJECT' && (
            <Form.Item
              label="Origin"
              name="originType"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select placeholder="Where did this defect come from?" options={ORIGIN_OPTIONS} />
            </Form.Item>
          )}

          {decision === 'REJECT' && originType === 'INHOUSE' && (
            <Form.Item
              label="Machine"
              name="machineId"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select
                placeholder="Select machine"
                options={machineOptions}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          {decision === 'REWORK' && (
            <Form.Item
              label="Rework Process"
              name="reworkProcessId"
              tooltip="Only this process's own step or an earlier one on the route — rework can't skip forward."
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select placeholder="Send back to which process?" options={reworkProcessOptions} />
            </Form.Item>
          )}

          <Form.Item
            label="Reason"
            name="reasonId"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              placeholder={decision ? 'Select reason' : 'Pick a decision first'}
              options={reasonOptions}
              disabled={!decision}
              notFoundContent={
                decision
                  ? `No active ${decision === 'REWORK' ? 'rework' : 'reject'} reasons set up yet`
                  : undefined
              }
            />
          </Form.Item>

          <Form.Item label="Remark" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}

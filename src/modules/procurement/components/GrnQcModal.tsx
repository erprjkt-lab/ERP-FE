import { App, Checkbox, Form, Input, InputNumber, Result, Typography } from 'antd'
import type { FC } from 'react'
import { getErrorMessage } from '@/api/client'
import { Modal } from '@/components/ui/Modal'
import { useIncomingInspectionReportsForGrnItem } from '@/modules/quality/hooks/useInspectionReports'
import type { ID } from '@/types'
import { ITEM_TYPE_RAW_MATERIAL } from '../constants'
import { useSaveGrnItemQc } from '../hooks/usePurchaseGrns'

/** The fields QC needs off a GRN line. Both shapes the app carries — the nested
 *  `GrnItem` on the detail page and the flat `GrnItemRow` in the list — satisfy
 *  it, so neither screen has to convert before opening this. */
export interface GrnQcLine {
  id: ID
  grnId: ID
  itemId: ID
  itemName?: string
  /** ItemMaster::TYPE_* — the flat list row carries it as a string. */
  itemType?: number | string
  receivedQty: number
  heatNo?: string | null
}

export interface GrnQcModalProps {
  line: GrnQcLine
  onClose: () => void
}

interface QcFormValues {
  acceptedQty?: number
  rejectedQty?: number
  shortQty?: number
  heatVerified?: boolean
  remark?: string
}

export const GrnQcModal: FC<GrnQcModalProps> = ({ line, onClose }) => {
  const [form] = Form.useForm<QcFormValues>()
  const { message } = App.useApp()
  const { mutateAsync: saveQc, isPending } = useSaveGrnItemQc()

  // ERP-BE refuses QC on a raw-material line until an IIR for it is approved.
  // Checked here rather than at each call site so the rule holds wherever QC is
  // opened from — the GRN detail page also disables its button on the same fact.
  const isRawMaterial = Number(line.itemType) === ITEM_TYPE_RAW_MATERIAL
  const { hasApprovedIir, isLoading: iirLoading } = useIncomingInspectionReportsForGrnItem(
    isRawMaterial ? String(line.id) : undefined,
  )
  const blockedByIir = isRawMaterial && (iirLoading || !hasApprovedIir)

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const accepted = values.acceptedQty ?? 0
      const rejected = values.rejectedQty ?? 0
      const short = values.shortQty ?? 0
      if (accepted + rejected + short > line.receivedQty) {
        message.error('Accepted + rejected + short quantity cannot exceed received quantity')
        return
      }
      await saveQc({
        grnItemId: String(line.id),
        grnId: String(line.grnId),
        payload: {
          accepted_qty: values.acceptedQty ?? null,
          rejected_qty: values.rejectedQty ?? null,
          short_qty: values.shortQty ?? null,
          heat_verified: values.heatVerified ?? null,
          remark: values.remark,
        },
      })
      message.success('QC result saved')
      onClose()
    } catch (error) {
      if (error instanceof Error) message.error(getErrorMessage(error))
    }
  }

  const title = `QC — ${line.itemName ?? line.itemId}`

  if (blockedByIir) {
    return (
      <Modal title={title} open onCancel={onClose} footer={null}>
        <Result
          status="warning"
          title={iirLoading ? 'Checking inspection reports…' : 'Approved IIR required first'}
          subTitle={
            iirLoading
              ? undefined
              : 'This is a raw-material line, so QC can only be recorded once its Incoming Inspection Report has been approved.'
          }
        />
      </Modal>
    )
  }

  return (
    <Modal
      title={title}
      open
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={isPending}
      okText="Save QC Result"
    >
      <Typography.Text type="secondary">Received Qty: {line.receivedQty}</Typography.Text>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Accepted Qty" name="acceptedQty">
          <InputNumber min={0} max={line.receivedQty} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Rejected Qty" name="rejectedQty">
          <InputNumber min={0} max={line.receivedQty} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Short Qty" name="shortQty">
          <InputNumber min={0} max={line.receivedQty} style={{ width: '100%' }} />
        </Form.Item>
        {line.heatNo && line.heatNo !== 'NA' && (
          <Form.Item label="Heat Verified" name="heatVerified" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        )}
        <Form.Item label="Remarks" name="remark">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

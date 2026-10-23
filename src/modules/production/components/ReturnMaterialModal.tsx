import { Alert, App, Descriptions, Form, InputNumber, Select } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import type { MaterialIssue, MaterialReturn } from '@/types/production'
import {
  useMaterialIssues,
  useMaterialReturns,
  useMaterialSummary,
  useReturnMaterial,
} from '../hooks/useJobCardMaterials'

export interface ReturnMaterialModalProps {
  open: boolean
  onClose: () => void
  jobCardId: string
}

interface ReturnFormValues {
  componentItemId: string
  lotKey: string
  returnedQty: number
  returnDate?: { format: (fmt: string) => string }
}

/** One location/batch/heat lot this component was issued from, with how much of
 *  it is still outstanding. ERP-BE caps a return per exact batch/heat, so the
 *  user picks the lot rather than a location and batch separately. */
interface IssuedLot {
  key: string
  storeLocationId: string
  storeLocationName: string
  batchNo?: string
  heatNo?: string
  outstandingQty: number
}

function lotKeyOf(parts: { storeLocationId: string; batchNo?: string; heatNo?: string }): string {
  return `${parts.storeLocationId}|${parts.batchNo ?? ''}|${parts.heatNo ?? ''}`
}

/**
 * Mirrors ERP-BE's per-batch return cap: for each location/batch/heat this
 * component was issued from, how much is still outstanding (issued minus
 * already returned). Lots with nothing left are dropped, so the picker only
 * offers lots a return can actually go back to. The server re-checks the cap —
 * this only keeps the input honest.
 */
export function buildIssuedLots(
  componentItemId: string | undefined,
  issues: MaterialIssue[],
  returns: MaterialReturn[],
): IssuedLot[] {
  if (!componentItemId) return []
  const byKey = new Map<string, IssuedLot>()

  for (const issue of issues) {
    if (issue.componentItemId !== componentItemId) continue
    const key = lotKeyOf(issue)
    const lot = byKey.get(key) ?? {
      key,
      storeLocationId: issue.storeLocationId,
      storeLocationName: issue.storeLocationName,
      batchNo: issue.batchNo,
      heatNo: issue.heatNo,
      outstandingQty: 0,
    }
    lot.outstandingQty += issue.issuedQty
    byKey.set(key, lot)
  }

  for (const entry of returns) {
    if (entry.componentItemId !== componentItemId) continue
    const lot = byKey.get(lotKeyOf(entry))
    if (lot) lot.outstandingQty -= entry.returnedQty
  }

  return Array.from(byKey.values()).filter(lot => lot.outstandingQty > 0)
}

export const ReturnMaterialModal: FC<ReturnMaterialModalProps> = ({ open, onClose, jobCardId }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<ReturnFormValues>()
  const [submitting, setSubmitting] = useState(false)

  const { data: summary = [] } = useMaterialSummary(jobCardId)
  const { data: issues = [] } = useMaterialIssues(jobCardId)
  const { data: returns = [] } = useMaterialReturns(jobCardId)
  const { mutateAsync: returnMaterial } = useReturnMaterial(jobCardId)

  const componentItemId = Form.useWatch('componentItemId', form) as string | undefined
  const lotKey = Form.useWatch('lotKey', form) as string | undefined

  const row = summary.find(entry => entry.componentItemId === componentItemId)

  // Nothing issued means nothing to give back, so those components aren't offered.
  const componentOptions = summary
    .filter(entry => entry.issuedQty > 0)
    .map(entry => ({
      label: `${entry.componentName} (${entry.pendingUsedQty} returnable)`,
      value: entry.componentItemId,
    }))

  const lots = useMemo(
    () => buildIssuedLots(componentItemId, issues, returns),
    [componentItemId, issues, returns],
  )

  const selectedLot = lots.find(lot => lot.key === lotKey)
  // Whichever of ERP-BE's two caps is tighter.
  const maxQty = Math.min(selectedLot?.outstandingQty ?? 0, row?.pendingUsedQty ?? 0)

  const close = () => {
    form.resetFields()
    onClose()
  }

  const handleOk = async () => {
    let values: ReturnFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const lot = lots.find(entry => entry.key === values.lotKey)
    if (!lot) return

    setSubmitting(true)
    try {
      await returnMaterial({
        component_item_id: Number(values.componentItemId),
        store_location_id: Number(lot.storeLocationId),
        batch_no: lot.batchNo,
        heat_no: lot.heatNo,
        returned_qty: values.returnedQty,
        return_date: values.returnDate ? values.returnDate.format('YYYY-MM-DD') : undefined,
      })
      message.success(`${values.returnedQty} returned to ${lot.storeLocationName}`)
      close()
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Return Material"
      open={open}
      onCancel={close}
      onOk={handleOk}
      confirmLoading={submitting}
      okButtonProps={{ disabled: componentOptions.length === 0 }}
      width={620}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ returnDate: dayjs() }}
        // A lot belongs to one component, so switching component has to drop the
        // picked lot and qty — doing it from the change event rather than during
        // render, since setFieldsValue touches the already-mounted fields.
        onValuesChange={changed => {
          if ('componentItemId' in changed) {
            form.setFieldsValue({ lotKey: undefined, returnedQty: undefined })
          }
        }}
      >
        <Form.Item
          label="Component"
          name="componentItemId"
          rules={[{ required: true, message: 'Component is required' }]}
        >
          <Select
            placeholder={
              componentOptions.length ? 'Select component' : 'No material issued on this job card'
            }
            options={componentOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {row && (
          <>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, md: 3 }}
              bordered
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="Issued">{row.issuedQty}</Descriptions.Item>
              <Descriptions.Item label="Used">{row.usedQty}</Descriptions.Item>
              <Descriptions.Item label="Already Returned">{row.returnedQty}</Descriptions.Item>
              <Descriptions.Item label="Returnable">{row.pendingUsedQty}</Descriptions.Item>
            </Descriptions>

            {row.pendingUsedQty <= 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Nothing returnable for this component"
                description="Everything issued has either been consumed by production or already returned."
              />
            )}

            <Form.Item
              label="Issued From (location / batch / heat)"
              name="lotKey"
              rules={[{ required: true, message: 'Pick the lot the material goes back to' }]}
            >
              <Select
                placeholder={lots.length ? 'Select lot' : 'No lot with outstanding qty'}
                options={lots.map(lot => ({
                  label: `${lot.storeLocationName} · ${lot.batchNo || '—'} / ${lot.heatNo || '—'} · ${lot.outstandingQty} outstanding`,
                  value: lot.key,
                }))}
              />
            </Form.Item>

            <Form.Item
              label={`Return Qty${maxQty > 0 ? ` (max ${maxQty})` : ''}`}
              name="returnedQty"
              rules={[
                { required: true, message: 'Return qty is required' },
                // ERP-BE validates gt:0, and `required` counts 0 as present.
                { type: 'number', min: 0.001, message: 'Return qty must be greater than 0' },
              ]}
            >
              <InputNumber min={0} max={maxQty} style={{ width: 200 }} disabled={!selectedLot} />
            </Form.Item>

            <FormField
              label="Return Date"
              name="returnDate"
              fieldType="date"
              style={{ width: 200 }}
            />
          </>
        )}
      </Form>
    </Modal>
  )
}

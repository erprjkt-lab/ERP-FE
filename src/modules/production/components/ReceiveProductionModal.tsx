import { App, Form, InputNumber, Select, Space, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { useLocations } from '@/modules/inventory/hooks/useLocations'
import type { ProductionReceipt } from '@/types/production'
import { useReceiveProduction } from '../hooks/useProductionReceipts'
import type { StepProgress } from '../utils/jobCardProgress'
import { getErrorMessage } from '@/api/client'
import { formatDateTime } from '@/utils/date'

export interface ReceiveProductionModalProps {
  open: boolean
  onClose: () => void
  jobCardId: string
  /** The last route step — the only one whose OK qty settles into stock. */
  step?: StepProgress
  /** Where the job card says finished goods land, used as the default store. */
  outputLocationId?: string
  outputLocationName?: string
  /** Receipts already taken against this job card. */
  receipts: ProductionReceipt[]
}

interface ReceiveFormValues {
  receivedQty: number
  storeLocationId?: string
  receivedAt?: { format: (fmt: string) => string }
}

export const ReceiveProductionModal: FC<ReceiveProductionModalProps> = ({
  open,
  onClose,
  jobCardId,
  step,
  outputLocationId,
  outputLocationName,
  receipts,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<ReceiveFormValues>()
  const { data: locations = [] } = useLocations()
  const { mutateAsync: receive, isPending } = useReceiveProduction(jobCardId)

  const readyQty = step?.readyToMoveQty ?? 0

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        receivedQty: readyQty,
        storeLocationId: outputLocationId,
        receivedAt: dayjs(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, readyQty, outputLocationId])

  const handleOk = async () => {
    let values: ReceiveFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    if (values.receivedQty > readyQty) {
      message.error(`Only ${readyQty} OK qty is available to receive`)
      return
    }

    try {
      await receive({
        received_qty: values.receivedQty,
        store_location_id: values.storeLocationId ? Number(values.storeLocationId) : undefined,
        received_at: values.receivedAt ? values.receivedAt.format('YYYY-MM-DD') : undefined,
      })
      message.success(`${values.receivedQty} received into store`)
      onClose()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns: TableColumnsType<ProductionReceipt> = [
    {
      title: 'Date',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 110,
      render: formatDateTime,
    },
    { title: 'Store', dataIndex: 'storeLocationName', key: 'storeLocationName' },
    { title: 'Qty', dataIndex: 'receivedQty', key: 'receivedQty', width: 90 },
  ]

  return (
    <Modal
      title={
        <Space wrap>
          <span>Receive into Store</span>
          <Tag color={readyQty > 0 ? 'green' : 'default'}>Ready: {readyQty}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Receive"
      confirmLoading={isPending}
      okButtonProps={{ disabled: readyQty <= 0 }}
      width={620}
    >
      <Typography.Paragraph type="secondary">
        {step
          ? `This is the final process. Receiving adds the OK quantity produced at ${step.step.processName} to finished-goods stock${outputLocationName ? ` in ${outputLocationName}` : ''}.`
          : 'Receiving adds the OK quantity produced at the final process to finished-goods stock.'}
      </Typography.Paragraph>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Receive Qty"
          name="receivedQty"
          rules={[
            { required: true, message: 'Quantity is required' },
            // ERP-BE validates gt:0, and `required` counts 0 as present.
            { type: 'number', min: 0.001, message: 'Receive qty must be greater than 0' },
          ]}
        >
          <InputNumber size="large" min={0} max={readyQty} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Store" name="storeLocationId">
          <Select
            placeholder="Job card's output store"
            options={locations.map(location => ({ label: location.name, value: location.id }))}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <FormField label="Receive Date" name="receivedAt" fieldType="date" style={{ width: 200 }} />
      </Form>

      {receipts.length > 0 && (
        <>
          <Typography.Title level={5}>Already received</Typography.Title>
          <DataTable<ProductionReceipt>
            columns={columns}
            dataSource={receipts}
            rowKey="id"
            pagination={false}
            size="small"
            totalLabel="receipts"
          />
        </>
      )}
    </Modal>
  )
}

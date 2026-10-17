import { App, Col, DatePicker, Form, Row, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormDrawer } from '@/components/ui/FormDrawer'
import { FormSection } from '@/components/ui/FormSection'
import type { IssueAgainstRequisitionLine } from '@/types/api/inventory'
import { useStockRequisition } from '../hooks/useStockRequisitions'
import { useIssueAgainstRequisition } from '../hooks/useStockIssues'
import { ItemLotAllocator, parseLotKey } from './ItemLotAllocator'

export interface RequisitionIssueDrawerProps {
  open: boolean
  onClose: () => void
  requisitionId?: string
}

export const RequisitionIssueDrawer: FC<RequisitionIssueDrawerProps> = ({
  open,
  onClose,
  requisitionId,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<{ issueDate: dayjs.Dayjs }>()
  // { requisitionItemId: { lotKey: qty } }
  const [qtyByItem, setQtyByItem] = useState<Record<string, Record<string, number>>>({})

  const { data: requisition, isLoading } = useStockRequisition(requisitionId)
  const { mutateAsync: issueAgainstRequisition, isPending } =
    useIssueAgainstRequisition(requisitionId)

  const pendingItems = (requisition?.items ?? []).filter(item => item.pendingQty > 0)

  const handleClose = () => {
    form.resetFields()
    setQtyByItem({})
    onClose()
  }

  const setLotQty = (itemId: string, key: string, qty: number | null) => {
    setQtyByItem(prev => ({ ...prev, [itemId]: { ...prev[itemId], [key]: qty ?? 0 } }))
  }

  const allocatedFor = (itemId: string) =>
    Object.values(qtyByItem[itemId] ?? {}).reduce((sum, qty) => sum + qty, 0)

  const handleSubmit = async () => {
    try {
      const header = await form.validateFields()
      const lines: IssueAgainstRequisitionLine[] = []

      for (const item of pendingItems) {
        const allocated = allocatedFor(String(item.id))
        if (allocated > item.pendingQty) {
          message.error(
            `${item.itemName ?? item.itemCode}: issuing ${allocated} exceeds the pending ${item.pendingQty}`,
          )
          return
        }
        for (const [key, qty] of Object.entries(qtyByItem[String(item.id)] ?? {})) {
          if (qty > 0) {
            const { locationId, batchNo, heatNo } = parseLotKey(key)
            lines.push({
              stock_requisition_item_id: Number(item.id),
              store_location_id: Number(locationId),
              batch_no: batchNo,
              heat_no: heatNo,
              issued_qty: qty,
            })
          }
        }
      }

      if (lines.length === 0) {
        message.error('Enter a quantity to issue from at least one location/batch')
        return
      }

      await issueAgainstRequisition({
        issue_date: header.issueDate ? header.issueDate.format('YYYY-MM-DD') : undefined,
        lines,
      })
      message.success('Stock issued against the requisition')
      handleClose()
    } catch (error) {
      if (error instanceof Error) message.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      title={
        requisition
          ? `Issue Stock — ${requisition.requisitionNumber}`
          : 'Issue Stock Against Requisition'
      }
      open={open}
      width={900}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitting={isPending}
      submitDisabled={pendingItems.length === 0}
      submitText="Issue Stock"
    >
      <Form form={form} layout="vertical" initialValues={{ issueDate: dayjs() }}>
        <FormSection title="Issue Details">
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Issue Date"
                name="issueDate"
                rules={[{ required: true, message: 'Issue date is required' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <FormSection title="Pending Items">
          {isLoading ? null : pendingItems.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 8,
                border: '1px dashed rgba(0, 0, 0, 0.15)',
              }}
            >
              <Typography.Text type="secondary">
                Nothing is pending on this requisition — every line has been issued in full.
              </Typography.Text>
            </div>
          ) : (
            pendingItems.map(item => (
              <ItemLotAllocator
                key={String(item.id)}
                itemId={String(item.itemId)}
                title={
                  `${item.itemCode ?? ''} ${item.itemName ?? ''}`.trim() || String(item.itemId)
                }
                qtyLabel="Issue Qty"
                values={qtyByItem[String(item.id)] ?? {}}
                onChange={(key, qty) => setLotQty(String(item.id), key, qty)}
                extra={
                  <Tag color={allocatedFor(String(item.id)) > item.pendingQty ? 'red' : 'blue'}>
                    {allocatedFor(String(item.id))} / {item.pendingQty} {item.uomName ?? ''}
                  </Tag>
                }
              />
            ))
          )}
        </FormSection>
      </Form>
    </FormDrawer>
  )
}

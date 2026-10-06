import { App, Button, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormSection } from '@/components/ui/FormSection'
import { useInspectionParameters } from '@/modules/production/hooks/useInspectionParameters'
import {
  useCreateIncomingInspectionReport,
  useIncomingInspectionReportsForGrnItem,
} from '../hooks/useInspectionReports'
import { InspectionReportDetail } from './InspectionReportDetailDrawer'
import { ReportReadingsFields, toReadingsPayload } from './ReportReadingsFields'

export interface IncomingInspectionReportsProps {
  grnItemId: string
  itemId: string
}

interface CreateFormValues {
  reportDate?: dayjs.Dayjs
  itemRevision?: string
  samplingQty?: number
  okQty?: number
  rejectedQty?: number
  readings?: Record<string, number | undefined>
}

export const IncomingInspectionReports: FC<IncomingInspectionReportsProps> = ({
  grnItemId,
  itemId,
}) => {
  const { message } = App.useApp()
  const [activeReportId, setActiveReportId] = useState<string>()
  const [form] = Form.useForm<CreateFormValues>()
  const { data: reports, isLoading } = useIncomingInspectionReportsForGrnItem(grnItemId)
  const { data: parameters = [] } = useInspectionParameters(itemId)
  const { mutateAsync: createReport, isPending: creating } =
    useCreateIncomingInspectionReport(grnItemId)

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      await createReport({
        report_date: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : undefined,
        item_revision: values.itemRevision ?? null,
        sampling_qty: values.samplingQty ?? null,
        ok_qty: values.okQty ?? null,
        rejected_qty: values.rejectedQty ?? null,
        readings: toReadingsPayload(values.readings),
      })
      message.success('Incoming Inspection Report created')
      form.resetFields()
    } catch (error) {
      if (error instanceof Error) message.error(getErrorMessage(error))
    }
  }

  if (isLoading) return null

  // Reports exist → show them inline (no second drawer); otherwise the create form.
  if (reports.length > 0) {
    const active = reports.find(r => r.id === activeReportId) ?? reports[0]
    return (
      <div>
        {reports.length > 1 && (
          <Select
            value={active.id}
            onChange={setActiveReportId}
            style={{ width: 280, marginBottom: 16 }}
            options={reports.map(r => ({ label: r.reportNumber, value: r.id }))}
          />
        )}
        <InspectionReportDetail reportId={active.id} itemId={itemId} />
      </div>
    )
  }

  return (
    <div>
      <Form form={form} layout="vertical" initialValues={{ reportDate: dayjs() }}>
        <FormSection title="Report Details">
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label="Report Date" name="reportDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Item Revision" name="itemRevision">
                <Input placeholder="e.g. Rev A" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label="Sampling Qty" name="samplingQty">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Qty inspected" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="OK Qty" name="okQty">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Qty accepted" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <FormSection title="Parameter Readings">
          <ReportReadingsFields parameters={parameters} form={form} />
        </FormSection>
      </Form>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button type="primary" loading={creating} onClick={handleCreate}>
          Create IIR
        </Button>
      </Space>
    </div>
  )
}

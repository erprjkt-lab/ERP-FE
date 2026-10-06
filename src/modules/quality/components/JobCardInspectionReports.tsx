import { App, Button, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { FormSection } from '@/components/ui/FormSection'
import { useInspectionParameters } from '@/modules/production/hooks/useInspectionParameters'
import { useProcesses } from '@/modules/production/hooks/useProcesses'
import type { InspectionReportType } from '@/types/quality'
import { REPORT_TYPE_LABELS } from '../constants'
import {
  TYPE_TO_API,
  useCreateInspectionReport,
  useInspectionReportsForJobCard,
} from '../hooks/useInspectionReports'
import { InspectionReportDetail } from './InspectionReportDetailDrawer'
import { ReportReadingsFields, toReadingsPayload } from './ReportReadingsFields'

export interface JobCardInspectionReportsProps {
  jobCardId: string
  itemId: string
  routeProcesses: { id: string; name: string }[]
  reportType: InspectionReportType
}

interface CreateFormValues {
  processId: string
  reportDate?: dayjs.Dayjs
  itemRevision?: string
  samplingQty?: number
  okQty?: number
  rejectedQty?: number
  readings?: Record<string, number | undefined>
}

export const JobCardInspectionReports: FC<JobCardInspectionReportsProps> = ({
  jobCardId,
  itemId,
  routeProcesses,
  reportType,
}) => {
  const { message } = App.useApp()
  const [activeReportId, setActiveReportId] = useState<string>()
  const [form] = Form.useForm<CreateFormValues>()
  const { data: allProcesses = [] } = useProcesses()
  const { data: allReports = [], isLoading } = useInspectionReportsForJobCard(jobCardId)
  const { mutateAsync: createReport, isPending: creating } = useCreateInspectionReport(jobCardId)

  const reports = allReports.filter(r => r.reportType === reportType)

  // Mirrors the BE's fillable-parameters rule (InspectionReportService): a report
  // can only be filed against an item+process that has control-plan parameters
  // with control_method = this report type. FIR additionally needs the process
  // flagged inspection_required.
  const { data: parameters = [] } = useInspectionParameters(itemId)
  const reportParameters = parameters.filter(p => p.controlMethod === reportType)

  const processOptions = routeProcesses
    .filter(rp => reportParameters.some(p => p.processId === rp.id))
    .filter(
      rp => reportType !== 'FIR' || allProcesses.find(p => p.id === rp.id)?.inspectionRequired,
    )
    .map(rp => ({ label: rp.name, value: rp.id }))

  const selectedProcessId = Form.useWatch('processId', form)
  const availableParameters = reportParameters.filter(p => p.processId === selectedProcessId)

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const availableParameterIds = new Set(availableParameters.map(p => p.id))
      const readings = toReadingsPayload(values.readings).filter(r =>
        availableParameterIds.has(String(r.parameter_id)),
      )
      await createReport({
        report_type: TYPE_TO_API[reportType],
        process_id: Number(values.processId),
        report_date: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : undefined,
        item_revision: values.itemRevision ?? null,
        sampling_qty: values.samplingQty ?? null,
        ok_qty: values.okQty ?? null,
        rejected_qty: values.rejectedQty ?? null,
        readings,
      })
      message.success(`${REPORT_TYPE_LABELS[reportType]} created`)
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
            options={reports.map(r => ({
              label: `${r.reportNumber}${r.processName ? ` — ${r.processName}` : ''}`,
              value: r.id,
            }))}
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
              <Form.Item
                label="Process"
                name="processId"
                rules={[{ required: true, message: 'Please select a process' }]}
              >
                <Select placeholder="Select process" options={processOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Report Date" name="reportDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item label="Item Revision" name="itemRevision">
                <Input placeholder="e.g. Rev A" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Sampling Qty" name="samplingQty">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Qty inspected" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={4}>
              <Form.Item label="OK Qty" name="okQty">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="OK" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={4}>
              <Form.Item label="Rejected Qty" name="rejectedQty">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="Rej" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <FormSection title="Parameter Readings">
          {!selectedProcessId ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 8,
                border: '1px dashed rgba(0, 0, 0, 0.15)',
              }}
            >
              <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
                Select a process above to load its inspection parameters.
              </span>
            </div>
          ) : (
            <ReportReadingsFields parameters={availableParameters} form={form} />
          )}
        </FormSection>
      </Form>
      <Space style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button
          type="primary"
          loading={creating}
          disabled={processOptions.length === 0}
          onClick={handleCreate}
        >
          Create {reportType}
        </Button>
      </Space>
      {processOptions.length === 0 && (
        <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
          No process on this job card&apos;s route has {reportType} inspection parameters
          {reportType === 'FIR' ? ' and inspection enabled' : ''}. Add them in BOM → Inspection
          Parameters.
        </span>
      )}
    </div>
  )
}

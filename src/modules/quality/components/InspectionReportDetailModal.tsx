import { CheckOutlined, DownloadOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons'
import { App, Button, Descriptions, Form, Modal, Space } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { downloadInspectionReportPdf } from '@/api/inspectionReports'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useInspectionParameters } from '@/modules/production/hooks/useInspectionParameters'
import type { InspectionReading } from '@/types/quality'
import {
  REPORT_STATUS_BADGE,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  RESULT_BADGE,
} from '../constants'
import {
  useAddInspectionReading,
  useApproveInspectionReport,
  useInspectionReport,
  useSubmitInspectionReport,
} from '../hooks/useInspectionReports'
import { ReportReadingsFields, toReadingsPayload } from './ReportReadingsFields'

export interface InspectionReportDetailModalProps {
  reportId: string
  itemId: string
  onClose: () => void
}

interface AddReadingsValues {
  readings?: Record<string, number | undefined>
}

export const InspectionReportDetailModal: FC<InspectionReportDetailModalProps> = ({
  reportId,
  itemId,
  onClose,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<AddReadingsValues>()
  const [downloading, setDownloading] = useState(false)
  const { data: report, isLoading } = useInspectionReport(reportId)
  const { data: itemParameters } = useInspectionParameters(itemId)
  const { mutateAsync: addReading, isPending: addingReading } = useAddInspectionReading(reportId)
  const { mutateAsync: submit, isPending: submitting } = useSubmitInspectionReport()
  const { mutateAsync: approve, isPending: approving } = useApproveInspectionReport()

  // IPR/FIR are scoped to the report's own process; IIR has no process at
  // all, so every parameter defined for the item is a candidate.
  const parameters = report?.processId
    ? itemParameters.filter(p => p.processId === report.processId)
    : itemParameters
  // Only offer parameters that haven't already been measured on this report
  // — re-measuring one would need its own explicit "remeasure" affordance,
  // not a second row silently appearing alongside the first.
  const unreadParameters = parameters.filter(
    p => !(report?.readings ?? []).some(r => r.parameterId === p.id),
  )

  const handleAddReadings = async (values: AddReadingsValues) => {
    const readings = toReadingsPayload(values.readings)
    if (readings.length === 0) return
    try {
      await Promise.all(
        readings.map(r =>
          addReading({ parameter_id: r.parameter_id, measured_value: r.measured_value }),
        ),
      )
      form.resetFields()
      message.success(readings.length > 1 ? 'Readings recorded' : 'Reading recorded')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleSubmit = async () => {
    try {
      await submit(reportId)
      message.success('Report submitted for approval')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleApprove = async () => {
    try {
      await approve(reportId)
      message.success('Report approved')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleDownload = async () => {
    if (!report) return
    setDownloading(true)
    try {
      await downloadInspectionReportPdf(Number(reportId), report.reportNumber)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setDownloading(false)
    }
  }

  const columns = [
    {
      title: 'Parameter',
      dataIndex: 'parameterName',
      key: 'parameterName',
      render: (v?: string) => v ?? '—',
    },
    {
      title: 'Measured',
      dataIndex: 'measuredValue',
      key: 'measuredValue',
      align: 'right' as const,
    },
    {
      title: 'Tolerance',
      key: 'tolerance',
      render: (_: unknown, r: InspectionReading) =>
        r.toleranceMin != null || r.toleranceMax != null
          ? `${r.toleranceMin ?? '—'} / ${r.toleranceMax ?? '—'}`
          : '—',
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result: InspectionReading['result']) => (
        <StatusBadge status={RESULT_BADGE[result]} label={result} />
      ),
    },
  ]

  return (
    <Modal
      title={
        report
          ? `${REPORT_TYPE_LABELS[report.reportType]} — ${report.reportNumber}`
          : 'Inspection Report'
      }
      open
      onCancel={onClose}
      footer={null}
      width={760}
    >
      {report && (
        <>
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Status">
              <StatusBadge
                status={REPORT_STATUS_BADGE[report.status]}
                label={REPORT_STATUS_LABELS[report.status]}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Report Date">{report.reportDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Process">{report.processName ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Sampling Qty">{report.samplingQty ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="OK Qty">{report.okQty ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Rejected Qty">{report.rejectedQty ?? '—'}</Descriptions.Item>
          </Descriptions>

          <DataTable
            columns={columns}
            dataSource={report.readings}
            rowKey="id"
            pagination={false}
            size="small"
            loading={isLoading}
          />

          {report.status === 'DRAFT' && unreadParameters.length > 0 && (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddReadings}
              style={{ marginTop: 16 }}
            >
              <ReportReadingsFields parameters={unreadParameters} />
              <Button icon={<PlusOutlined />} loading={addingReading} onClick={() => form.submit()}>
                Save Readings
              </Button>
            </Form>
          )}

          <Space style={{ marginTop: 16 }}>
            {report.status === 'DRAFT' && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={submitting}
                disabled={report.readings.length === 0}
                onClick={handleSubmit}
              >
                Submit for Approval
              </Button>
            )}
            {report.status === 'SUBMITTED' && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={approving}
                onClick={handleApprove}
              >
                Approve
              </Button>
            )}
            <Button icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
              Download PDF
            </Button>
          </Space>
        </>
      )}
    </Modal>
  )
}

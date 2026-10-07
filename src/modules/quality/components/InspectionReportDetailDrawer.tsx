import { CheckOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Drawer, Form, Space, Typography } from 'antd'
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
} from '../hooks/useInspectionReports'
import { ReportReadingsFields, toReadingsPayload } from './ReportReadingsFields'

export interface InspectionReportDetailProps {
  reportId?: string
  itemId?: string
}

export interface InspectionReportDetailDrawerProps extends InspectionReportDetailProps {
  open: boolean
  onClose: () => void
}

interface AddReadingsValues {
  readings?: Record<string, number | undefined>
}

// Report header, actions and readings — rendered inline so it can live inside
// any drawer/tab without stacking a second drawer on top.
export const InspectionReportDetail: FC<InspectionReportDetailProps> = ({ reportId, itemId }) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<AddReadingsValues>()
  const [downloading, setDownloading] = useState(false)
  const { data: report, isLoading } = useInspectionReport(reportId)
  const { data: itemParameters = [] } = useInspectionParameters(itemId)
  const { mutateAsync: addReading, isPending: addingReading } = useAddInspectionReading(
    reportId ?? '',
  )
  const { mutateAsync: approve, isPending: approving } = useApproveInspectionReport()

  const parameters = report?.processId
    ? itemParameters.filter(p => p.processId === report.processId)
    : itemParameters

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

  const handleApprove = async () => {
    if (!reportId) return
    try {
      await approve(reportId)
      message.success('Report approved')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleDownload = async () => {
    if (!report || !reportId) return
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
      title: 'Instrument',
      key: 'instrument',
      render: (_: unknown, r: InspectionReading) =>
        parameters.find(p => p.id === r.parameterId)?.instrument ?? '—',
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

  const statusBadge = report?.status ? REPORT_STATUS_BADGE[report.status] : 'draft'
  const statusLabel = report?.status ? REPORT_STATUS_LABELS[report.status] : ''

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {report?.reportNumber ?? 'Inspection Report'}
          </Typography.Title>
          {report?.reportType && (
            <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>
              ({REPORT_TYPE_LABELS[report.reportType]})
            </span>
          )}
          {report?.status && <StatusBadge status={statusBadge} label={statusLabel} />}
        </div>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownload}
            disabled={!report}
          >
            Download PDF
          </Button>
          {report?.status === 'SUBMITTED' && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={approving}
              onClick={handleApprove}
            >
              Approve
            </Button>
          )}
        </Space>
      </div>
      {isLoading ? (
        <p>Loading report details...</p>
      ) : !report ? (
        <p>Report not found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} bordered>
            <Descriptions.Item label="Date">{report.reportDate ?? '—'}</Descriptions.Item>
            {report.processName && (
              <Descriptions.Item label="Process">{report.processName}</Descriptions.Item>
            )}
            <Descriptions.Item label="Item Revision">
              {report.itemRevision ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Sampling Qty">{report.samplingQty ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="OK Qty">{report.okQty ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Rejected Qty">{report.rejectedQty ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Approved By">{report.approvedBy ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Approved At">{report.approvedAt ?? '—'}</Descriptions.Item>
          </Descriptions>

          <Card
            size="small"
            title={
              <Typography.Title level={5} style={{ margin: 0 }}>
                Recorded Readings ({report.readings.length})
              </Typography.Title>
            }
          >
            <DataTable<InspectionReading>
              columns={columns}
              dataSource={report.readings}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No readings recorded for this report.' }}
            />
          </Card>

          {report.status === 'SUBMITTED' && unreadParameters.length > 0 && (
            <Card
              size="small"
              title={
                <Typography.Title level={5} style={{ margin: 0 }}>
                  Add Readings ({unreadParameters.length} remaining)
                </Typography.Title>
              }
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  loading={addingReading}
                  onClick={() => form.submit()}
                >
                  Save Readings
                </Button>
              }
            >
              <Form form={form} onFinish={handleAddReadings}>
                <ReportReadingsFields parameters={unreadParameters} form={form} />
              </Form>
            </Card>
          )}
        </div>
      )}
    </>
  )
}

export const InspectionReportDetailDrawer: FC<InspectionReportDetailDrawerProps> = ({
  open,
  onClose,
  ...detailProps
}) => (
  <Drawer title="Inspection Report" open={open} onClose={onClose} width={880}>
    <InspectionReportDetail {...detailProps} />
  </Drawer>
)

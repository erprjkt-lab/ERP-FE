import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useInspectionParameters } from '@/modules/production/hooks/useInspectionParameters'
import { useProcesses } from '@/modules/production/hooks/useProcesses'
import type { InspectionReport, InspectionReportType } from '@/types/quality'
import { REPORT_STATUS_BADGE, REPORT_STATUS_LABELS, REPORT_TYPE_LABELS } from '../constants'
import {
  TYPE_TO_API,
  useCreateInspectionReport,
  useInspectionReportsForJobCard,
} from '../hooks/useInspectionReports'
import { InspectionReportDetailModal } from './InspectionReportDetailModal'
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
  const [createOpen, setCreateOpen] = useState(false)
  const [activeReportId, setActiveReportId] = useState<string>()
  const [form] = Form.useForm<CreateFormValues>()
  const { data: allProcesses } = useProcesses()
  const { data: allReports, isLoading } = useInspectionReportsForJobCard(jobCardId)
  const { mutateAsync: createReport, isPending: creating } = useCreateInspectionReport(jobCardId)

  const reports = allReports.filter(r => r.reportType === reportType)

  const processOptions = routeProcesses
    .filter(rp => {
      if (reportType !== 'FIR') return true
      const process = allProcesses.find(p => p.id === rp.id)
      return process?.inspectionRequired === true
    })
    .map(rp => ({ label: rp.name, value: rp.id }))

  const selectedProcessId = Form.useWatch('processId', form)
  const { data: parameters } = useInspectionParameters(itemId)
  const availableParameters = parameters.filter(p => p.processId === selectedProcessId)

  const handleCreate = async (values: CreateFormValues) => {
    try {
      // antd retains a Form.Item's value after it unmounts, so if the user
      // switches process after typing a reading, the old parameter's value
      // can still be sitting in values.readings — filter to only the
      // parameters that actually belong to the currently-selected process.
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
      setCreateOpen(false)
      form.resetFields()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns: TableColumnsType<InspectionReport> = [
    { title: 'Report #', dataIndex: 'reportNumber', key: 'reportNumber' },
    { title: 'Date', dataIndex: 'reportDate', key: 'reportDate', render: v => v ?? '—' },
    { title: 'Process', dataIndex: 'processName', key: 'processName', render: v => v ?? '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: InspectionReport['status']) => (
        <StatusBadge status={REPORT_STATUS_BADGE[status]} label={REPORT_STATUS_LABELS[status]} />
      ),
    },
    {
      title: 'Readings',
      key: 'readings',
      render: (_, r) => r.readings.length,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => setActiveReportId(r.id)}>
          View
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={processOptions.length === 0}
          onClick={() => setCreateOpen(true)}
        >
          New {reportType}
        </Button>
        {reportType === 'FIR' && processOptions.length === 0 && (
          <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
            No process on this job card's route requires final inspection.
          </span>
        )}
      </Space>

      <DataTable<InspectionReport>
        columns={columns}
        dataSource={reports}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="small"
        locale={{ emptyText: `No ${reportType} reports yet.` }}
      />

      {createOpen && (
        <Modal
          title={`New ${REPORT_TYPE_LABELS[reportType]}`}
          open
          onCancel={() => setCreateOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={creating}
          width={720}
          okText="Create"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            initialValues={{ reportDate: dayjs() }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Process"
                  name="processId"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select placeholder="Select process" options={processOptions} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Report Date" name="reportDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Item Revision" name="itemRevision">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Sampling Qty" name="samplingQty">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="OK Qty" name="okQty">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Rejected Qty" name="rejectedQty">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <ReportReadingsFields parameters={availableParameters} />
          </Form>
        </Modal>
      )}

      {activeReportId && (
        <InspectionReportDetailModal
          reportId={activeReportId}
          itemId={itemId}
          onClose={() => setActiveReportId(undefined)}
        />
      )}
    </div>
  )
}

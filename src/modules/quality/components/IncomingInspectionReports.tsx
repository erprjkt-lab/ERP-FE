import { EyeOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Space } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { getErrorMessage } from '@/api/client'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useInspectionParameters } from '@/modules/production/hooks/useInspectionParameters'
import type { InspectionReport } from '@/types/quality'
import { REPORT_STATUS_BADGE, REPORT_STATUS_LABELS } from '../constants'
import {
  useCreateIncomingInspectionReport,
  useIncomingInspectionReportsForGrnItem,
} from '../hooks/useInspectionReports'
import { InspectionReportDetailModal } from './InspectionReportDetailModal'
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
  const [createOpen, setCreateOpen] = useState(false)
  const [activeReportId, setActiveReportId] = useState<string>()
  const [form] = Form.useForm<CreateFormValues>()
  const { data: reports, isLoading } = useIncomingInspectionReportsForGrnItem(grnItemId)
  const { data: parameters } = useInspectionParameters(itemId)
  const { mutateAsync: createReport, isPending: creating } =
    useCreateIncomingInspectionReport(grnItemId)

  const handleCreate = async (values: CreateFormValues) => {
    try {
      await createReport({
        report_date: values.reportDate ? values.reportDate.format('YYYY-MM-DD') : undefined,
        item_revision: values.itemRevision ?? null,
        sampling_qty: values.samplingQty ?? null,
        ok_qty: values.okQty ?? null,
        rejected_qty: values.rejectedQty ?? null,
        readings: toReadingsPayload(values.readings),
      })
      message.success('Incoming Inspection Report created')
      setCreateOpen(false)
      form.resetFields()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns: TableColumnsType<InspectionReport> = [
    { title: 'Report #', dataIndex: 'reportNumber', key: 'reportNumber' },
    { title: 'Date', dataIndex: 'reportDate', key: 'reportDate', render: v => v ?? '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: InspectionReport['status']) => (
        <StatusBadge status={REPORT_STATUS_BADGE[status]} label={REPORT_STATUS_LABELS[status]} />
      ),
    },
    { title: 'Readings', key: 'readings', render: (_, r) => r.readings.length },
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          New IIR
        </Button>
      </Space>

      <DataTable<InspectionReport>
        columns={columns}
        dataSource={reports}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="small"
        locale={{ emptyText: 'No IIR reports yet for this line.' }}
      />

      {createOpen && (
        <Modal
          title="New Incoming Inspection Report"
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
              <Col span={8}>
                <Form.Item label="Report Date" name="reportDate">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Item Revision" name="itemRevision">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Sampling Qty" name="samplingQty">
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="OK Qty" name="okQty">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <ReportReadingsFields parameters={parameters} />
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

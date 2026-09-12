import { CheckOutlined, EditOutlined, InboxOutlined, SendOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ledgerText } from '@/theme/typography'
import type { JobCardMovement, MaterialIssue, ProcessLog } from '@/types/production'
import { AcceptProductionModal } from '../components/AcceptProductionModal'
import { IssueMaterialModal } from '../components/IssueMaterialModal'
import { LogProductionModal } from '../components/LogProductionModal'
import { MoveForwardModal } from '../components/MoveForwardModal'
import { useItemBom } from '../hooks/useItemBom'
import { useJobCard } from '../hooks/useJobCards'
import { useBomRequirements, useMaterialIssues } from '../hooks/useJobCardMaterials'
import { useJobCardMovements } from '../hooks/useJobCardMovements'
import { useProcessLogs } from '../hooks/useProcessLogs'
import { computeStepProgress } from '../utils/jobCardProgress'
import type { StepProgress } from '../utils/jobCardProgress'

interface MaterialRow {
  key: string
  componentName: string
  requiredQty: number
  issuedQty: number
  pendingQty: number
}

const SummaryStat: FC<{ label: string; value: number; tone?: string }> = ({
  label,
  value,
  tone,
}) => (
  <div>
    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
      {label}
    </Typography.Text>
    <span style={{ ...ledgerText, fontSize: 24, fontWeight: 600, color: tone }}>{value}</span>
  </div>
)

const MetaItem: FC<{ label: string; value?: string }> = ({ label, value }) => (
  <span style={{ fontSize: 13 }}>
    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
      {label}:{' '}
    </Typography.Text>
    <Typography.Text strong style={{ fontSize: 13 }}>
      {value || '—'}
    </Typography.Text>
  </span>
)

export const JobCardDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [issueOpen, setIssueOpen] = useState(false)
  const [activeStepId, setActiveStepId] = useState<string>()
  const [drawer, setDrawer] = useState<'accept' | 'log' | 'move'>()

  const { data: jobCard, isLoading } = useJobCard(id)
  const { data: logs = [], isLoading: logsLoading } = useProcessLogs(id)
  const { data: movements = [] } = useJobCardMovements(id)
  const { data: requirements = [] } = useBomRequirements(id)
  const { data: issues = [], isLoading: issuesLoading } = useMaterialIssues(id)
  const { data: bomLines = [] } = useItemBom(jobCard?.itemId)

  const orderedQty = jobCard?.orderedQty ?? 0
  const progress = computeStepProgress(jobCard?.routes ?? [], logs, movements, orderedQty)
  const currentStep = progress.find(row => row.isCurrent)
  const activeStep = progress.find(row => row.step.processId === activeStepId) ?? currentStep
  const activeIndex = progress.findIndex(row => row.step.processId === activeStep?.step.processId)
  const nextStep = activeIndex >= 0 ? progress[activeIndex + 1] : undefined

  const hasMaterial = issues.length > 0
  const isClosed = jobCard?.status === 'completed' || jobCard?.status === 'closed'
  const finalOk = progress.length ? progress[progress.length - 1].okQty : 0
  const totalRejected = progress.reduce((sum, row) => sum + row.rejectedQty, 0)
  const completionPercent = orderedQty > 0 ? Math.round((finalOk / orderedQty) * 100) : 0

  const openDrawer = (step: StepProgress, which: 'accept' | 'log' | 'move') => {
    setActiveStepId(step.step.processId)
    setDrawer(which)
  }

  const materialRows: MaterialRow[] = bomLines.map(line => {
    const requirement = requirements.find(req => req.componentItemId === line.componentItemId)
    const requiredQty = requirement?.requiredQty ?? line.quantityPerUnit * orderedQty
    const issuedQty = requirement?.issuedQty ?? 0
    return {
      key: line.componentItemId,
      componentName: line.componentName || requirement?.componentName || '',
      requiredQty,
      issuedQty,
      pendingQty: Math.max(requiredQty - issuedQty, 0),
    }
  })

  const processColumns: TableColumnsType<StepProgress> = [
    {
      title: '#',
      key: 'seq',
      width: 50,
      render: (_, record) => record.step.sequenceNo,
    },
    {
      title: 'Process',
      key: 'process',
      render: (_, record) => (
        <Space>
          <span style={{ fontWeight: record.isCurrent ? 600 : 400 }}>
            {record.step.processName}
          </span>
          {record.isCurrent && <Tag color="blue">Current</Tag>}
        </Space>
      ),
    },
    {
      title: 'Unaccepted',
      dataIndex: 'unacceptedQty',
      key: 'unacceptedQty',
      width: 110,
      render: value => (value > 0 ? <Tag color="orange">{value}</Tag> : <span>0</span>),
    },
    { title: 'In', dataIndex: 'availableQty', key: 'availableQty', width: 80 },
    { title: 'OK', dataIndex: 'okQty', key: 'okQty', width: 80 },
    { title: 'Rejected', dataIndex: 'rejectedQty', key: 'rejectedQty', width: 95 },
    { title: 'Pending', dataIndex: 'pendingQty', key: 'pendingQty', width: 90 },
    {
      title: 'To Move',
      dataIndex: 'readyToMoveQty',
      key: 'readyToMoveQty',
      width: 95,
      render: (value, record) =>
        value > 0 && !record.isLast ? <Tag color="green">{value}</Tag> : <span>{value}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      width: 260,
      render: (_, record) => {
        const canAccept = record.unacceptedQty > 0
        const canLog = record.pendingQty > 0 && (!record.isFirst || hasMaterial)
        const canMove = record.readyToMoveQty > 0 && !record.isLast
        // The one step the floor should do next gets the filled button.
        const primary = canAccept ? 'accept' : canLog ? 'log' : canMove ? 'move' : undefined

        return (
          <Space size="small" wrap>
            <Button
              size="small"
              icon={<CheckOutlined />}
              type={primary === 'accept' ? 'primary' : 'default'}
              disabled={!canAccept || isClosed}
              onClick={() => openDrawer(record, 'accept')}
            >
              Accept
            </Button>
            <Button
              size="small"
              icon={<EditOutlined />}
              type={primary === 'log' ? 'primary' : 'default'}
              disabled={!canLog || isClosed}
              onClick={() => openDrawer(record, 'log')}
            >
              Log
            </Button>
            <Button
              size="small"
              icon={<SendOutlined />}
              type={primary === 'move' ? 'primary' : 'default'}
              disabled={!canMove || isClosed}
              onClick={() => openDrawer(record, 'move')}
            >
              Move
            </Button>
          </Space>
        )
      },
    },
  ]

  const materialColumns: TableColumnsType<MaterialRow> = [
    { title: 'Component', dataIndex: 'componentName', key: 'componentName' },
    { title: 'Required', dataIndex: 'requiredQty', key: 'requiredQty', width: 110 },
    { title: 'Issued', dataIndex: 'issuedQty', key: 'issuedQty', width: 110 },
    { title: 'Pending', dataIndex: 'pendingQty', key: 'pendingQty', width: 110 },
  ]

  const issueColumns: TableColumnsType<MaterialIssue> = [
    { title: 'Component', dataIndex: 'componentName', key: 'componentName' },
    { title: 'Qty', dataIndex: 'issuedQty', key: 'issuedQty', width: 90 },
    { title: 'Store', dataIndex: 'storeLocationName', key: 'storeLocationName', width: 150 },
    { title: 'Batch', dataIndex: 'batchNo', key: 'batchNo', width: 110 },
    { title: 'Date', dataIndex: 'issueDate', key: 'issueDate', width: 110 },
  ]

  const logColumns: TableColumnsType<ProcessLog> = [
    { title: 'Date', dataIndex: 'logDate', key: 'logDate', width: 110 },
    { title: 'Process', dataIndex: 'processName', key: 'processName' },
    { title: 'Operator', dataIndex: 'operatorName', key: 'operatorName' },
    { title: 'Shift', dataIndex: 'shiftName', key: 'shiftName', width: 100 },
    { title: 'OK', dataIndex: 'okQty', key: 'okQty', width: 70 },
    { title: 'Rejected', dataIndex: 'rejectedQty', key: 'rejectedQty', width: 90 },
  ]

  const movementColumns: TableColumnsType<JobCardMovement> = [
    {
      title: 'Date',
      dataIndex: 'movedAt',
      key: 'movedAt',
      width: 110,
      render: value => String(value).slice(0, 10),
    },
    { title: 'From', dataIndex: 'fromProcessName', key: 'fromProcessName' },
    { title: 'To', dataIndex: 'toProcessName', key: 'toProcessName' },
    { title: 'Moved', dataIndex: 'movedQty', key: 'movedQty', width: 90 },
    {
      title: 'Accepted',
      key: 'accepted',
      width: 100,
      render: (_, record) =>
        record.acceptances.reduce((sum, acceptance) => sum + acceptance.acceptedQty, 0),
    },
  ]

  return (
    <div>
      <PageHeader
        title={jobCard ? jobCard.jobCardNumber : 'Job Card'}
        subtitle={jobCard ? `${jobCard.itemName} · ${orderedQty} ordered` : undefined}
        breadcrumbs={[
          { label: 'Production' },
          { label: 'Work Order (Jobcard)', href: '/production/work-orders' },
          { label: jobCard?.jobCardNumber ?? 'Detail' },
        ]}
        actions={
          <Space>
            {jobCard && <StatusBadge status={jobCard.status} />}
            <Button onClick={() => navigate('/production/work-orders')}>Back</Button>
            <Button
              type={hasMaterial ? 'default' : 'primary'}
              icon={<InboxOutlined />}
              onClick={() => setIssueOpen(true)}
              disabled={!jobCard || isClosed}
            >
              Issue Material
            </Button>
          </Space>
        }
      />

      <Card size="small" loading={isLoading} style={{ marginBottom: 16 }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={12} sm={6} md={3}>
            <SummaryStat label="Ordered" value={orderedQty} />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <SummaryStat label="Completed" value={finalOk} tone="#237804" />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <SummaryStat
              label="Rejected"
              value={totalRejected}
              tone={totalRejected ? '#a8071a' : undefined}
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <SummaryStat label="Balance" value={Math.max(orderedQty - finalOk, 0)} />
          </Col>
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Progress
                percent={completionPercent}
                status={isClosed ? 'success' : 'active'}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                {currentStep ? `At ${currentStep.step.processName}` : 'Not started'}
              </Tag>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
          <MetaItem label="Item" value={jobCard?.itemName} />
          <MetaItem label="Party" value={jobCard?.partyName} />
          <MetaItem label="Target" value={jobCard?.targetDate} />
          <MetaItem label="Output Store" value={jobCard?.outputLocationName} />
          <MetaItem label="Material" value={hasMaterial ? 'Issued' : 'Not issued'} />
        </div>
      </Card>

      {!hasMaterial && !isClosed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Material not issued yet"
          description="Issue material for this job card before the first process can be logged."
          action={
            <Button size="small" type="primary" onClick={() => setIssueOpen(true)}>
              Issue Material
            </Button>
          }
        />
      )}

      <Card title="Process Detail" style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
        <Table<StepProgress>
          columns={processColumns}
          dataSource={progress}
          rowKey={record => record.step.id}
          loading={isLoading}
          pagination={false}
          size="middle"
          scroll={{ x: 'max-content' }}
          rowClassName={record => (record.isCurrent ? 'erp-current-process-row' : '')}
        />
      </Card>

      <Card styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          items={[
            {
              key: 'materials',
              label: 'Materials',
              children: (
                <DataTable<MaterialRow>
                  columns={materialColumns}
                  dataSource={materialRows}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  totalLabel="components"
                />
              ),
            },
            {
              key: 'issues',
              label: `Material Issues (${issues.length})`,
              children: (
                <DataTable<MaterialIssue>
                  columns={issueColumns}
                  dataSource={issues}
                  rowKey="id"
                  loading={issuesLoading}
                  pagination={false}
                  size="small"
                  totalLabel="issues"
                />
              ),
            },
            {
              key: 'logs',
              label: `Production Logs (${logs.length})`,
              children: (
                <DataTable<ProcessLog>
                  columns={logColumns}
                  dataSource={logs}
                  rowKey="id"
                  loading={logsLoading}
                  pagination={false}
                  size="small"
                  totalLabel="logs"
                />
              ),
            },
            {
              key: 'movements',
              label: `Movements (${movements.length})`,
              children: (
                <DataTable<JobCardMovement>
                  columns={movementColumns}
                  dataSource={movements}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  totalLabel="movements"
                />
              ),
            },
          ]}
        />
      </Card>

      {jobCard && (
        <>
          <IssueMaterialModal
            open={issueOpen}
            onClose={() => setIssueOpen(false)}
            jobCardId={jobCard.id}
            itemId={jobCard.itemId}
            orderedQty={orderedQty}
          />
          <AcceptProductionModal
            open={drawer === 'accept'}
            onClose={() => setDrawer(undefined)}
            jobCardId={jobCard.id}
            step={activeStep}
            movements={movements.filter(
              movement => movement.toProcessId === activeStep?.step.processId,
            )}
          />
          <LogProductionModal
            open={drawer === 'log'}
            onClose={() => setDrawer(undefined)}
            jobCardId={jobCard.id}
            step={activeStep}
            logs={logs}
            nextProcessName={nextStep?.step.processName}
            outputLocationName={jobCard.outputLocationName}
            hasMaterialIssued={hasMaterial}
          />
          <MoveForwardModal
            open={drawer === 'move'}
            onClose={() => setDrawer(undefined)}
            jobCardId={jobCard.id}
            step={activeStep}
            nextStep={nextStep}
            movements={movements.filter(
              movement => movement.fromProcessId === activeStep?.step.processId,
            )}
          />
        </>
      )}
    </div>
  )
}

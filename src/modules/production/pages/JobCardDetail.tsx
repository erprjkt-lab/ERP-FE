import {
  CheckOutlined,
  DeleteOutlined,
  RollbackOutlined,
  EditOutlined,
  ExportOutlined,
  InboxOutlined,
  SendOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Progress,
  Row,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePagePermission } from '@/hooks/usePagePermission'
import { useModulePermission } from '@/store/permissionStore'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { JobCardInspectionReports } from '@/modules/quality/components/JobCardInspectionReports'
import type {
  JobCardMovement,
  MaterialIssue,
  MaterialReturn,
  ProcessLog,
  ProductionReceipt,
} from '@/types/production'
import { AcceptProductionModal } from '../components/AcceptProductionModal'
import { MetaItem, SummaryStat } from '../components/JobCardStats'
import { LogProductionModal } from '../components/LogProductionModal'
import { MoveForwardModal } from '../components/MoveForwardModal'
import { ReceiveProductionModal } from '../components/ReceiveProductionModal'
import { RequestOutsourceModal } from '../components/RequestOutsourceModal'
import { ReturnMaterialModal } from '../components/ReturnMaterialModal'
import { useItemBom } from '../hooks/useItemBom'
import { useJobCard } from '../hooks/useJobCards'
import {
  useBomRequirements,
  useDeleteMaterialIssue,
  useDeleteMaterialReturn,
  useMaterialIssues,
  useMaterialReturns,
  useMaterialSummary,
} from '../hooks/useJobCardMaterials'
import {
  useDeleteAcceptance,
  useDeleteMovement,
  useJobCardMovements,
} from '../hooks/useJobCardMovements'
import { useDeleteProcessLog, useProcessLogs } from '../hooks/useProcessLogs'
import { useDeleteProductionReceipt, useProductionReceipts } from '../hooks/useProductionReceipts'
import { useReworkReviewsForJobCard } from '../hooks/useRejections'
import { computeJobCardTotals, computeStepProgress } from '../utils/jobCardProgress'
import type { StepProgress } from '../utils/jobCardProgress'
import { computeReworkBatches } from '../utils/reworkProgress'
import { getErrorMessage } from '@/api/client'
import { formatDateTime } from '@/utils/date'

/** One acceptance, flattened out of the movement it belongs to, so it can be
 *  listed and reversed on its own. */
interface AcceptanceRow {
  id: string
  movementId: string
  fromProcessName: string
  toProcessName: string
  isRework: boolean
  acceptedQty: number
  shortQty: number
  acceptedAt: string
}

interface MaterialRow {
  key: string
  componentName: string
  requiredQty: number
  issuedQty: number
  /** Consumed by production - derived by ERP-BE, 0 until something is issued. */
  usedQty: number
  returnedQty: number
  /** Issued but neither used nor returned: the most that may still be returned. */
  pendingUsedQty: number
  /** Still to be issued against the requirement. */
  pendingQty: number
}

export const JobCardDetail: FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canWrite, canModify, canDelete } = usePagePermission()
  const { message, modal } = App.useApp()
  const { canWrite: canWriteChallans } = useModulePermission('job-card-challans')

  const [activeStepId, setActiveStepId] = useState<string>()
  // Set while the open modal belongs to a rework batch rather than the first pass.
  const [activeReworkReviewId, setActiveReworkReviewId] = useState<string>()
  const [drawer, setDrawer] = useState<'accept' | 'log' | 'move' | 'outsource' | 'receive'>()
  const [returnOpen, setReturnOpen] = useState(false)

  const { data: jobCard, isLoading } = useJobCard(id)
  const { data: logs = [], isLoading: logsLoading } = useProcessLogs(id)
  const { data: movements = [] } = useJobCardMovements(id)
  const { data: requirements = [] } = useBomRequirements(id)
  const { data: issues = [], isLoading: issuesLoading } = useMaterialIssues(id)
  const { data: materialSummary = [], isLoading: summaryLoading } = useMaterialSummary(id)
  const { data: materialReturns = [], isLoading: returnsLoading } = useMaterialReturns(id)
  const { data: receipts = [], isLoading: receiptsLoading } = useProductionReceipts(id)
  const { data: bomLines = [] } = useItemBom(jobCard?.itemId)
  const { mutateAsync: removeLog } = useDeleteProcessLog(id)
  const { mutateAsync: removeMovement } = useDeleteMovement(id)
  const { mutateAsync: removeAcceptance } = useDeleteAcceptance(id)
  const { mutateAsync: removeIssue } = useDeleteMaterialIssue(id)
  const { mutateAsync: removeReturn } = useDeleteMaterialReturn(id)
  const { mutateAsync: removeReceipt } = useDeleteProductionReceipt(id)
  const {
    data: reworkReviews,
    allReviews: rejectionReviews,
    rejections,
    isLoading: reworkLoading,
  } = useReworkReviewsForJobCard(id)

  const orderedQty = jobCard?.orderedQty ?? 0
  // The first pass and the redo are two separate runs through the same route, so each
  // tab counts only its own logs. A rework log re-processes qty the first pass already
  // counted, and mixing them would double-count every step.
  const firstPassLogs = logs.filter(log => !log.isRework)
  // ERP-BE no longer posts finished-goods stock when the last step is logged; the
  // qty waits to be received, so what has been received nets out of that step's
  // ready-to-move figure the way a movement does for every earlier step.
  const receivedQty = receipts.reduce((sum, receipt) => sum + receipt.receivedQty, 0)
  const progress = computeStepProgress(
    jobCard?.routes ?? [],
    firstPassLogs,
    movements,
    orderedQty,
    receivedQty,
  )
  const reworkBatches = computeReworkBatches(jobCard?.routes ?? [], reworkReviews, logs, movements)
  const activeBatch = reworkBatches.find(batch => batch.review.id === activeReworkReviewId)
  const activeRows = activeBatch?.steps ?? progress
  const currentStep = progress.find(row => row.isCurrent)
  const activeStep =
    activeRows.find(row => row.step.processId === activeStepId) ??
    (activeBatch ? undefined : currentStep)
  const activeIndex = progress.findIndex(row => row.step.processId === activeStep?.step.processId)
  const nextStep = activeIndex >= 0 ? progress[activeIndex + 1] : undefined

  const hasMaterial = issues.length > 0
  const isClosed = jobCard?.status === 'completed' || jobCard?.status === 'closed'
  // The per-process tables split the two passes apart; the summary strip is
  // about the order as a whole and counts both.
  // Written off for good. Qty sent back for rework is NOT scrapped — it is
  // still in play, and counting it as settled would finish the order while the
  // redo was still on the floor.
  const scrappedQty = rejectionReviews
    .filter(review => review.decision === 'REJECT' && review.status === 'APPROVED')
    .reduce((sum, review) => sum + review.reviewedQty, 0)
  const {
    completedQty: finalOk,
    rejectedQty: totalRejected,
    balanceQty,
    completionPercent,
  } = computeJobCardTotals(jobCard?.routes ?? [], logs, orderedQty, scrappedQty)
  // Nothing left unaccepted or pending anywhere on the route — there's no
  // backend "complete" action for a job card yet, so this is a display-only
  // signal, not the real jobCard.status.
  const reworkOutstanding = reworkBatches.some(batch =>
    batch.steps.some(row => row.pendingQty > 0 || row.unacceptedQty > 0),
  )
  const isFullyProduced =
    progress.length > 0 &&
    finalOk > 0 &&
    balanceQty === 0 &&
    progress.every(row => row.pendingQty === 0 && row.unacceptedQty === 0) &&
    !reworkOutstanding

  const openDrawer = (
    step: StepProgress,
    which: 'accept' | 'log' | 'move' | 'outsource' | 'receive',
    reworkReviewId?: string,
  ) => {
    setActiveStepId(step.step.processId)
    setActiveReworkReviewId(reworkReviewId)
    setDrawer(which)
  }

  // Which bucket the open modal is acting on: a Rework row sets the review id.
  const isReworkAction = !!activeReworkReviewId

  const closeDrawer = () => {
    setDrawer(undefined)
    setActiveReworkReviewId(undefined)
  }

  // Every reversal is one of three near-identical confirms, and ERP-BE is the one
  // that decides whether the entry may go (it refuses out-of-order reversals with
  // a message naming what to undo first), so this just relays what it says.
  const confirmDelete = (opts: {
    title: string
    content: string
    run: () => Promise<unknown>
    success: string
  }) => {
    modal.confirm({
      title: opts.title,
      content: opts.content,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await opts.run()
          message.success(opts.success)
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  // A log's rejected qty raises a rejection, and reviewing it writes rows that
  // ERP-BE's own delete path does not account for: rejection_reviews.rejection_id
  // is an ON DELETE RESTRICT foreign key, so deleting the log would fail at the
  // database with a 500 rather than a readable validation error. Block it here
  // until ERP-BE guards it properly.
  const reviewedQtyForLog = (processLogId: string) => {
    const rejectionIds = rejections
      .filter(rejection => rejection.processLogId === processLogId)
      .map(rejection => rejection.id)

    return rejectionReviews
      .filter(review => rejectionIds.includes(review.rejectionId))
      .reduce((sum, review) => sum + review.reviewedQty, 0)
  }

  const acceptanceRows: AcceptanceRow[] = movements.flatMap(movement =>
    movement.acceptances.map(acceptance => ({
      id: acceptance.id,
      movementId: movement.id,
      fromProcessName: movement.fromProcessName,
      toProcessName: movement.toProcessName,
      isRework: movement.isRework,
      acceptedQty: acceptance.acceptedQty,
      shortQty: acceptance.shortQty,
      acceptedAt: acceptance.acceptedAt,
    })),
  )

  // `blockedBy` is for the cases ERP-BE does NOT guard: it either errors at the
  // database instead of validating, or lets the delete through and leaves
  // something unrecoverable behind. Everything ERP-BE does check is left to it,
  // so its own message is what the user sees.
  const deleteColumn = <T,>(
    build: (record: T) => {
      title: string
      content: string
      run: () => Promise<unknown>
      success: string
      blockedBy?: string
    },
  ) => ({
    title: '',
    key: 'delete',
    width: 50,
    align: 'right' as const,
    render: (_: unknown, record: T) => {
      const { blockedBy } = build(record)
      return (
        <Tooltip
          title={isClosed ? 'Job card is closed' : (blockedBy ?? 'Delete and revert this entry')}
        >
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={isClosed || !!blockedBy}
            onClick={() => confirmDelete(build(record))}
          />
        </Tooltip>
      )
    },
  })

  // material-summary carries the server's own required/issued/used/returned/pending
  // per component, but only once something has been issued (the requirement rows
  // it reads are created lazily by the first issue), so the planned figures still
  // fall back to the item's BOM before that.
  const materialRows: MaterialRow[] = bomLines.map(line => {
    const summaryRow = materialSummary.find(r => r.componentItemId === line.componentItemId)
    const requirement = requirements.find(req => req.componentItemId === line.componentItemId)
    const requiredQty =
      summaryRow?.requiredQty ?? requirement?.requiredQty ?? line.quantityPerUnit * orderedQty
    const issuedQty = summaryRow?.issuedQty ?? requirement?.issuedQty ?? 0
    return {
      key: line.componentItemId,
      componentName:
        line.componentName || summaryRow?.componentName || requirement?.componentName || '',
      requiredQty,
      issuedQty,
      usedQty: summaryRow?.usedQty ?? 0,
      returnedQty: summaryRow?.returnedQty ?? 0,
      pendingUsedQty: summaryRow?.pendingUsedQty ?? 0,
      pendingQty: Math.max(requiredQty - issuedQty, 0),
    }
  })

  const makeProcessColumns = (reworkReviewId?: string): TableColumnsType<StepProgress> => [
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
      width: 190,
      render: (_, record) => {
        const canAccept = record.unacceptedQty > 0
        const canLog = record.pendingQty > 0 && (!record.isFirst || hasMaterial)
        // The last step has no next process to move to — its OK qty settles by
        // being received into store, which is the same "send it onward" slot.
        const canMove = record.readyToMoveQty > 0
        const canOutsource = record.pendingQty > 0
        // The one step the floor should do next gets the filled button.
        const onwardKey = record.isLast ? 'receive' : 'move'
        const primary = canAccept ? 'accept' : canLog ? 'log' : canMove ? onwardKey : undefined

        const actions = [
          { key: 'accept' as const, label: 'Accept', icon: <CheckOutlined />, enabled: canAccept },
          { key: 'log' as const, label: 'Log', icon: <EditOutlined />, enabled: canLog },
          {
            key: 'outsource' as const,
            label: 'Outsource',
            icon: <ExportOutlined />,
            enabled: canOutsource,
          },
          record.isLast
            ? {
                key: 'receive' as const,
                label: 'Receive',
                icon: <InboxOutlined />,
                enabled: canMove,
              }
            : { key: 'move' as const, label: 'Move', icon: <SendOutlined />, enabled: canMove },
        ].filter(action =>
          // Accept/Log/Move all mutate this job card; Outsource instead creates a
          // job card challan, so it answers to that module.
          action.key === 'outsource' ? canWriteChallans : canModify,
        )

        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {actions.map(action => (
              <Button
                key={action.key}
                size="small"
                type={action.key === primary ? 'primary' : 'default'}
                icon={action.icon}
                disabled={!action.enabled || isClosed}
                onClick={() => openDrawer(record, action.key, reworkReviewId)}
                style={{ fontSize: 12, paddingInline: 6 }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )
      },
    },
  ]

  const materialColumns: TableColumnsType<MaterialRow> = [
    { title: 'Component', dataIndex: 'componentName', key: 'componentName' },
    { title: 'Required', dataIndex: 'requiredQty', key: 'requiredQty', width: 100 },
    { title: 'Issued', dataIndex: 'issuedQty', key: 'issuedQty', width: 95 },
    {
      title: 'To Issue',
      dataIndex: 'pendingQty',
      key: 'pendingQty',
      width: 95,
      render: value => (value > 0 ? <Tag color="orange">{value}</Tag> : <span>0</span>),
    },
    { title: 'Used', dataIndex: 'usedQty', key: 'usedQty', width: 90 },
    { title: 'Returned', dataIndex: 'returnedQty', key: 'returnedQty', width: 100 },
    {
      title: 'Returnable',
      dataIndex: 'pendingUsedQty',
      key: 'pendingUsedQty',
      width: 110,
      render: value => (value > 0 ? <Tag color="blue">{value}</Tag> : <span>{value}</span>),
    },
  ]

  const issueColumns: TableColumnsType<MaterialIssue> = [
    { title: 'Component', dataIndex: 'componentName', key: 'componentName' },
    { title: 'Qty', dataIndex: 'issuedQty', key: 'issuedQty', width: 90 },
    { title: 'Store', dataIndex: 'storeLocationName', key: 'storeLocationName', width: 150 },
    { title: 'Batch', dataIndex: 'batchNo', key: 'batchNo', width: 110 },
    { title: 'Date', dataIndex: 'issueDate', key: 'issueDate', width: 110, render: formatDateTime },
    ...(canDelete
      ? [
          deleteColumn<MaterialIssue>(issue => ({
            title: `Delete the issue of ${issue.issuedQty} ${issue.componentName}?`,
            content:
              'Puts the material back into store stock. Refused once production has been logged on this job card, or once any of this component has been returned.',
            run: () => removeIssue(issue.id),
            success: 'Material issue deleted and stock returned',
          })),
        ]
      : []),
  ]

  const returnColumns: TableColumnsType<MaterialReturn> = [
    { title: 'Component', dataIndex: 'componentName', key: 'componentName' },
    { title: 'Qty', dataIndex: 'returnedQty', key: 'returnedQty', width: 90 },
    { title: 'Store', dataIndex: 'storeLocationName', key: 'storeLocationName', width: 150 },
    { title: 'Batch', dataIndex: 'batchNo', key: 'batchNo', width: 110, render: v => v || '-' },
    { title: 'Heat', dataIndex: 'heatNo', key: 'heatNo', width: 100, render: v => v || '-' },
    {
      title: 'Date',
      dataIndex: 'returnDate',
      key: 'returnDate',
      width: 110,
      render: formatDateTime,
    },
    ...(canDelete
      ? [
          deleteColumn<MaterialReturn>(entry => ({
            title: `Delete the return of ${entry.returnedQty} ${entry.componentName}?`,
            content:
              'Takes the material back out of store stock and onto the job card again. Refused if the returned stock has since been consumed elsewhere.',
            run: () => removeReturn(entry.id),
            success: 'Material return deleted and reverted',
          })),
        ]
      : []),
  ]

  const receiptColumns: TableColumnsType<ProductionReceipt> = [
    {
      title: 'Date',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 110,
      render: formatDateTime,
    },
    { title: 'Item', dataIndex: 'itemName', key: 'itemName' },
    { title: 'Store', dataIndex: 'storeLocationName', key: 'storeLocationName', width: 170 },
    { title: 'Qty', dataIndex: 'receivedQty', key: 'receivedQty', width: 90 },
    ...(canDelete
      ? [
          deleteColumn<ProductionReceipt>(receipt => ({
            title: `Delete the receipt of ${receipt.receivedQty}?`,
            content:
              'Takes the finished goods back out of store stock and returns the qty to ready-to-receive at the final process. Refused if any of it has already been issued or sold.',
            run: () => removeReceipt(receipt.id),
            success: 'Production receipt deleted and stock reversed',
          })),
        ]
      : []),
  ]

  const logColumns: TableColumnsType<ProcessLog> = [
    { title: 'Date', dataIndex: 'logDate', key: 'logDate', width: 110, render: formatDateTime },
    { title: 'Process', dataIndex: 'processName', key: 'processName' },
    { title: 'Operator', dataIndex: 'operatorName', key: 'operatorName' },
    { title: 'Shift', dataIndex: 'shiftName', key: 'shiftName', width: 100 },
    { title: 'OK', dataIndex: 'okQty', key: 'okQty', width: 70 },
    { title: 'Rejected', dataIndex: 'rejectedQty', key: 'rejectedQty', width: 90 },
    ...(canDelete
      ? [
          deleteColumn<ProcessLog>(log => {
            const reviewedQty = reviewedQtyForLog(log.id)
            return {
              title: `Delete this ${log.processName} log?`,
              content:
                'Reverses everything the log posted: finished-goods stock, the received qty on its source challan, the qty it consumed from an outsource request, and the rejection its rejected qty raised.',
              run: () => removeLog(log.id),
              success: 'Production log deleted and reverted',
              // Until the rejection queries land, reviewedQtyForLog reads 0 for
              // every log, so the guard below would wave through exactly the
              // delete it exists to stop. Stay disabled until it can answer.
              blockedBy: reworkLoading
                ? 'Checking rejection reviews…'
                : reviewedQty > 0
                  ? `Cannot delete: ${reviewedQty} of this log's rejected qty has already been reviewed. Reverse the rejection review first.`
                  : undefined,
            }
          }),
        ]
      : []),
  ]

  const movementColumns: TableColumnsType<JobCardMovement> = [
    {
      title: 'Date',
      dataIndex: 'movedAt',
      key: 'movedAt',
      width: 110,
      render: formatDateTime,
    },
    { title: 'From', dataIndex: 'fromProcessName', key: 'fromProcessName' },
    { title: 'To', dataIndex: 'toProcessName', key: 'toProcessName' },
    {
      title: 'Type',
      key: 'type',
      width: 100,
      render: (_, record) => (record.isRework ? <Tag color="red">Rework</Tag> : <Tag>Regular</Tag>),
    },
    { title: 'Moved', dataIndex: 'movedQty', key: 'movedQty', width: 90 },
    {
      title: 'Accepted',
      key: 'accepted',
      width: 100,
      render: (_, record) =>
        record.acceptances.reduce((sum, acceptance) => sum + acceptance.acceptedQty, 0),
    },
    ...(canDelete
      ? [
          deleteColumn<JobCardMovement>(movement => ({
            title: `Delete the move of ${movement.movedQty} to ${movement.toProcessName}?`,
            content:
              'The qty goes back to being ready-to-move at the earlier process. Refused while any of it is still accepted at the next step — delete the acceptance first.',
            run: () => removeMovement(movement.id),
            success: 'Movement deleted and reverted',
            // ERP-BE creates this row itself when a Rework review is approved, and
            // only on approval — a review cannot be approved twice, so there is no
            // way to put the movement back. Deleting it would strand the approved
            // review with nothing to redo against.
            blockedBy: movement.reworkReviewId
              ? 'Cannot delete: this movement was created by an approved rework review and cannot be recreated.'
              : undefined,
          })),
        ]
      : []),
  ]

  const acceptanceColumns: TableColumnsType<AcceptanceRow> = [
    {
      title: 'Date',
      dataIndex: 'acceptedAt',
      key: 'acceptedAt',
      width: 110,
      render: formatDateTime,
    },
    { title: 'From', dataIndex: 'fromProcessName', key: 'fromProcessName' },
    { title: 'At', dataIndex: 'toProcessName', key: 'toProcessName' },
    {
      title: 'Type',
      key: 'type',
      width: 100,
      render: (_, record) => (record.isRework ? <Tag color="red">Rework</Tag> : <Tag>Regular</Tag>),
    },
    { title: 'Accepted', dataIndex: 'acceptedQty', key: 'acceptedQty', width: 95 },
    {
      title: 'Short',
      dataIndex: 'shortQty',
      key: 'shortQty',
      width: 85,
      render: value => (value > 0 ? <Tag color="orange">{value}</Tag> : <span>0</span>),
    },
    ...(canDelete
      ? [
          deleteColumn<AcceptanceRow>(row => ({
            title: `Delete the acceptance of ${row.acceptedQty} at ${row.toProcessName}?`,
            content:
              'The qty goes back to unaccepted at this process. Refused once anything has been logged or outsourced against it — reverse those first.',
            run: () => removeAcceptance(row.id),
            success: 'Acceptance deleted and reverted',
          })),
        ]
      : []),
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
            <Tooltip title="Issue material from Inventory → Issue Material">
              <Button icon={<InboxOutlined />} disabled>
                Issue Material
              </Button>
            </Tooltip>
            {canWrite && (
              <Tooltip
                title={
                  isClosed
                    ? 'Job card is closed'
                    : hasMaterial
                      ? 'Send unused issued material back to store'
                      : 'Nothing issued on this job card yet'
                }
              >
                <Button
                  icon={<RollbackOutlined />}
                  disabled={isClosed || !hasMaterial}
                  onClick={() => setReturnOpen(true)}
                >
                  Return Material
                </Button>
              </Tooltip>
            )}
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
            <SummaryStat label="Balance" value={balanceQty} />
          </Col>
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Progress
                percent={completionPercent}
                status={isClosed || isFullyProduced ? 'success' : 'active'}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <Tag color={isFullyProduced ? 'green' : 'blue'} style={{ marginInlineEnd: 0 }}>
                {isFullyProduced
                  ? 'Completed'
                  : currentStep
                    ? `At ${currentStep.step.processName}`
                    : 'Not started'}
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
          <MetaItem
            label="Material"
            value={issuesLoading ? undefined : hasMaterial ? 'Issued' : 'Not issued'}
          />
        </div>
      </Card>

      {!issuesLoading && !hasMaterial && !isClosed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Material not issued yet"
          description="Issue material for this job card from Inventory → Issue Material before the first process can be logged."
        />
      )}

      <Card style={{ marginBottom: 16 }} styles={{ body: { paddingTop: 8 } }}>
        <Tabs
          items={[
            {
              key: 'process',
              label: 'Process Detail',
              children: (
                <DataTable<StepProgress>
                  columns={makeProcessColumns()}
                  dataSource={progress}
                  rowKey={record => record.step.id}
                  loading={isLoading}
                  pagination={false}
                  size="middle"
                  scroll={{ x: 'max-content' }}
                  rowClassName={record => (record.isCurrent ? 'erp-current-process-row' : '')}
                />
              ),
            },
            {
              key: 'rework',
              label: `Rejection / Rework (${reworkBatches.length})`,
              children:
                reworkBatches.length === 0 ? (
                  <Empty
                    description="No rework batches yet. Rejected qty appears here once Rejection Review approves a Rework decision for it."
                    style={{ padding: '32px 0' }}
                  />
                ) : (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {reworkBatches.map(batch => (
                      <div key={batch.review.id}>
                        <Space wrap style={{ marginBottom: 8 }}>
                          <Typography.Text strong>
                            {batch.review.reviewedQty} back to{' '}
                            {batch.review.reworkProcessName ?? '—'}
                          </Typography.Text>
                          {batch.review.reasonName && <Tag>{batch.review.reasonName}</Tag>}
                          <Tag color={batch.outstandingQty > 0 ? 'orange' : 'default'}>
                            {batch.outstandingQty} to redo
                          </Tag>
                          <Tag color={batch.finishedQty > 0 ? 'green' : 'default'}>
                            {batch.finishedQty} finished
                          </Tag>
                        </Space>
                        <DataTable<StepProgress>
                          columns={makeProcessColumns(batch.review.id)}
                          dataSource={batch.steps}
                          rowKey={record => record.step.id}
                          loading={reworkLoading}
                          pagination={false}
                          size="middle"
                          scroll={{ x: 'max-content' }}
                          rowClassName={record =>
                            record.isCurrent ? 'erp-current-process-row' : ''
                          }
                        />
                      </div>
                    ))}
                  </Space>
                ),
            },
          ]}
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
                  loading={summaryLoading}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
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
              key: 'returns',
              label: `Material Returns (${materialReturns.length})`,
              children: (
                <DataTable<MaterialReturn>
                  columns={returnColumns}
                  dataSource={materialReturns}
                  rowKey="id"
                  loading={returnsLoading}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  totalLabel="returns"
                />
              ),
            },
            {
              key: 'receipts',
              label: `Stock Received (${receipts.length})`,
              children: (
                <DataTable<ProductionReceipt>
                  columns={receiptColumns}
                  dataSource={receipts}
                  rowKey="id"
                  loading={receiptsLoading}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  totalLabel="receipts"
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
            {
              key: 'acceptances',
              label: `Acceptances (${acceptanceRows.length})`,
              children: (
                <DataTable<AcceptanceRow>
                  columns={acceptanceColumns}
                  dataSource={acceptanceRows}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  totalLabel="acceptances"
                />
              ),
            },
            {
              key: 'quality',
              label: 'Quality',
              children: jobCard && (
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                  <div>
                    <Typography.Title level={5}>
                      In-Process Inspection Reports (IPR)
                    </Typography.Title>
                    <JobCardInspectionReports
                      jobCardId={jobCard.id}
                      itemId={jobCard.itemId}
                      routeProcesses={jobCard.routes.map(r => ({
                        id: r.processId,
                        name: r.processName,
                      }))}
                      reportType="IPR"
                    />
                  </div>
                  <div>
                    <Typography.Title level={5}>Final Inspection Reports (FIR)</Typography.Title>
                    <JobCardInspectionReports
                      jobCardId={jobCard.id}
                      itemId={jobCard.itemId}
                      routeProcesses={jobCard.routes.map(r => ({
                        id: r.processId,
                        name: r.processName,
                      }))}
                      reportType="FIR"
                    />
                  </div>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {jobCard && (
        <>
          <AcceptProductionModal
            open={drawer === 'accept'}
            onClose={closeDrawer}
            jobCardId={jobCard.id}
            step={activeStep}
            // An acceptance inherits its bucket from the movement, so the list
            // only ever offers movements from the row that was acted on.
            movements={movements.filter(
              movement =>
                movement.toProcessId === activeStep?.step.processId &&
                movement.isRework === isReworkAction,
            )}
          />
          <RequestOutsourceModal
            open={drawer === 'outsource'}
            onClose={closeDrawer}
            jobCardId={jobCard.id}
            isRework={isReworkAction}
            step={activeStep}
          />
          <LogProductionModal
            open={drawer === 'log'}
            onClose={closeDrawer}
            jobCardId={jobCard.id}
            step={activeStep}
            logs={activeBatch ? logs.filter(log => log.isRework) : firstPassLogs}
            nextProcessName={nextStep?.step.processName}
            outputLocationName={jobCard.outputLocationName}
            hasMaterialIssued={hasMaterial}
            reworkReviewId={activeReworkReviewId}
          />
          <ReturnMaterialModal
            open={returnOpen}
            onClose={() => setReturnOpen(false)}
            jobCardId={jobCard.id}
          />
          <ReceiveProductionModal
            open={drawer === 'receive'}
            onClose={closeDrawer}
            jobCardId={jobCard.id}
            step={activeStep}
            outputLocationId={jobCard.outputLocationId}
            outputLocationName={jobCard.outputLocationName}
            receipts={receipts}
          />
          <MoveForwardModal
            open={drawer === 'move'}
            onClose={closeDrawer}
            jobCardId={jobCard.id}
            isRework={isReworkAction}
            step={activeStep}
            nextStep={nextStep}
            movements={movements.filter(
              movement =>
                movement.fromProcessId === activeStep?.step.processId &&
                movement.isRework === isReworkAction,
            )}
          />
        </>
      )}
    </div>
  )
}

import { App, Button, Card, Drawer, Empty, Input, Progress, Segmented, Space, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import {
  CheckOutlined,
  DeleteOutlined,
  UndoOutlined,
  ExportOutlined,
  EyeOutlined,
  InboxOutlined,
  LockOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { useCallback, useMemo, useState } from 'react'
import { usePagePermission } from '@/hooks/usePagePermission'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { TableActionItem } from '@/components/ui/TableActionBar'
import { AcceptChallanItemModal } from '../components/AcceptChallanItemModal'
import { CreateChallanDrawer } from '../components/CreateChallanDrawer'
import { useDeleteChallanRequest, usePendingChallanRequests } from '../hooks/useChallanRequests'
import {
  useAllChallans,
  useCloseChallan,
  useDeleteChallan,
  useUnmarkChallanReceived,
} from '../hooks/useJobCardChallans'
import { useJobCards } from '../hooks/useJobCards'
import type { Challan, ChallanItem, ChallanRequest, ChallanStatus } from '@/types/production'
import { getErrorMessage } from '@/api/client'
import { formatDateTime } from '@/utils/date'
import './Outsource.css'

/** One line of the outsource ledger: a request still waiting to be dispatched,
 *  or the challan it was bundled into. `status` is what the filter and the
 *  Status column read, so both stages sort into the same set of chips. */
type OutsourceRow =
  | { key: string; kind: 'request'; status: 'pending'; request: ChallanRequest }
  | { key: string; kind: 'challan'; status: ChallanStatus; challan: Challan }

export const OutsourceList = () => {
  const { message, modal } = App.useApp()
  const { canWrite, canModify, canDelete } = usePagePermission()
  const { data: jobCards = [] } = useJobCards()
  const {
    data: pendingRequests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = usePendingChallanRequests()
  const {
    data: challans = [],
    isLoading: challansLoading,
    refetch: refetchChallans,
    isFetching,
  } = useAllChallans()
  // `variables` is the id passed to the mutation, so `isPending && variables === id`
  // narrows the spinner to the row that was clicked instead of every row sharing
  // the mutation.
  const {
    mutateAsync: closeChallanMutation,
    isPending: closing,
    variables: closingId,
  } = useCloseChallan()
  const {
    mutateAsync: unmarkReceived,
    isPending: unreceiving,
    variables: unreceivingId,
  } = useUnmarkChallanReceived()
  const {
    mutateAsync: deleteChallanMutation,
    isPending: deletingChallan,
    variables: deletingChallanId,
  } = useDeleteChallan()
  const {
    mutateAsync: deleteRequestMutation,
    isPending: deletingRequest,
    variables: deletingRequestId,
  } = useDeleteChallanRequest()

  const [createChallanOpen, setCreateChallanOpen] = useState(false)
  const [seedRequestId, setSeedRequestId] = useState<string>()
  const [acceptTarget, setAcceptTarget] = useState<{ challan: Challan; item: ChallanItem }>()

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Hold the id, not the row: the drawer is now the only detail view, so it has
  // to show what a refetch brings back (an accepted item, a new status) rather
  // than a copy taken when it was opened.
  const [drawerChallanId, setDrawerChallanId] = useState<string>()

  // Reopens a challan ERP-BE advanced to Received, to accept more against it or
  // to undo a receipt logged against the wrong one.
  const handleUnmarkReceived = async (challanId: string) => {
    try {
      await unmarkReceived(challanId)
      message.success('Challan reverted to open')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleClose = async (challanId: string) => {
    try {
      await closeChallanMutation(challanId)
      message.success('Challan reconciled and closed successfully')
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  // ERP-BE allows a delete only while nothing has been received/consumed against
  // the record, and refuses with a message saying what to reverse first; we relay it.
  const handleDeleteChallan = (challan: Challan) => {
    modal.confirm({
      title: `Delete challan ${challan.challanNumber}?`,
      content:
        'The dispatched qty goes back to the outsource requests it was raised from. Refused once anything has been received back against it.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteChallanMutation(challan.id)
          message.success('Challan deleted and its requests reopened')
          if (drawerChallanId === challan.id) setDrawerChallanId(undefined)
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const handleDeleteRequest = (request: ChallanRequest) => {
    modal.confirm({
      title: `Delete the outsource request for ${request.requestedQty} at ${request.processName}?`,
      content:
        'The qty goes back to pending at that process. Refused once any of it has been dispatched or consumed.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteRequestMutation(request.id)
          message.success('Outsource request deleted')
        } catch (error) {
          message.error(getErrorMessage(error))
        }
      },
    })
  }

  const jobCardsById = useMemo(() => new Map(jobCards.map(jc => [jc.id, jc])), [jobCards])
  // Memoised so the search filter below can depend on it directly rather than on
  // the map it closes over — same result, minus the lint warning for a dep the
  // filter was already tracking indirectly.
  const jobCardLabel = useCallback(
    (jobCardId: string) => {
      const jc = jobCardsById.get(jobCardId)
      return jc ? `${jc.jobCardNumber} · ${jc.itemName}` : jobCardId
    },
    [jobCardsById],
  )

  // KPI telemetry summary calculations
  const openCount = useMemo(() => challans.filter(c => c.status === 'open').length, [challans])
  const receivedCount = useMemo(
    () => challans.filter(c => c.status === 'received').length,
    [challans],
  )
  const closedCount = useMemo(() => challans.filter(c => c.status === 'closed').length, [challans])

  const challanActions = (challan: Challan): TableActionItem[] => {
    // Accepting a line is the only thing that records qty: it writes the process
    // log and credits the job card. ERP-BE advances the challan to Received by
    // itself once every line is in, so there is no manual "mark received" to
    // offer — it only ever flipped the status, leaving challans sitting at
    // "Received, 0 of 10" with nothing recorded anywhere.
    const outstandingQty = challan.items.reduce((sum, item) => sum + item.outstandingQty, 0)
    const outstandingItems = challan.items.filter(item => item.outstandingQty > 0)

    return [
      {
        key: 'details',
        label: 'View Details',
        icon: <EyeOutlined />,
        variant: 'default',
        onClick: () => setDrawerChallanId(challan.id),
      },
      {
        key: 'accept',
        label: 'Accept Returned Qty',
        icon: <InboxOutlined />,
        variant: 'primary',
        hidden: outstandingQty <= 0 || challan.status === 'closed' || !canModify,
        // One line to receive: straight into the accept form. Several, and the
        // challan has to be opened to say which line came back.
        onClick: () =>
          outstandingItems.length === 1
            ? setAcceptTarget({ challan, item: outstandingItems[0] })
            : setDrawerChallanId(challan.id),
      },
      {
        key: 'close',
        label: 'Close Challan',
        icon: <LockOutlined />,
        variant: 'primary',
        hidden: challan.status !== 'received' || !canModify,
        loading: closing && closingId === challan.id,
        onClick: () => handleClose(challan.id),
      },
      {
        key: 'unreceive',
        label: 'Undo Receive',
        icon: <UndoOutlined />,
        variant: 'warning',
        hidden: challan.status !== 'received' || !canModify,
        loading: unreceiving && unreceivingId === challan.id,
        onClick: () => handleUnmarkReceived(challan.id),
      },
      {
        key: 'delete',
        label: 'Delete Challan',
        icon: <DeleteOutlined />,
        variant: 'danger',
        danger: true,
        hidden: challan.status !== 'open' || !canDelete,
        loading: deletingChallan && deletingChallanId === challan.id,
        onClick: () => handleDeleteChallan(challan),
      },
    ]
  }

  const requestActions = (request: ChallanRequest): TableActionItem[] => [
    {
      key: 'create-challan',
      label: 'Create Challan',
      icon: <ExportOutlined />,
      variant: 'accent',
      hidden: !canWrite,
      onClick: () => {
        setSeedRequestId(request.id)
        setCreateChallanOpen(true)
      },
    },
    {
      key: 'delete',
      label: 'Delete Request',
      icon: <DeleteOutlined />,
      variant: 'danger',
      danger: true,
      hidden: !canDelete,
      loading: deletingRequest && deletingRequestId === request.id,
      onClick: () => handleDeleteRequest(request),
    },
  ]

  // Resolved against the live list every render, so accepting an item or
  // changing the status updates the open drawer as soon as the refetch lands.
  // Reads undefined once the challan is deleted, which closes the drawer.
  const drawerChallan = challans.find(challan => challan.id === drawerChallanId)

  // A request and the challan it becomes are two stages of one thing, and
  // splitting them across tabs meant the floor had to know which tab a job was
  // sitting in. One list, ordered pending-first, with the stage in the Status
  // column.
  const rows: OutsourceRow[] = useMemo(
    () => [
      ...pendingRequests.map<OutsourceRow>(request => ({
        key: `request-${request.id}`,
        kind: 'request',
        status: 'pending',
        request,
      })),
      ...challans.map<OutsourceRow>(challan => ({
        key: `challan-${challan.id}`,
        kind: 'challan',
        status: challan.status,
        challan,
      })),
    ],
    [pendingRequests, challans],
  )

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return rows.filter(row => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!q) return true

      if (row.kind === 'request') {
        return (
          row.request.processName.toLowerCase().includes(q) ||
          jobCardLabel(row.request.jobCardId).toLowerCase().includes(q)
        )
      }

      return (
        row.challan.challanNumber.toLowerCase().includes(q) ||
        row.challan.destinationPartyName.toLowerCase().includes(q) ||
        row.challan.items.some(
          item =>
            item.processName.toLowerCase().includes(q) ||
            jobCardLabel(item.jobCardId).toLowerCase().includes(q),
        )
      )
    })
  }, [rows, searchQuery, statusFilter, jobCardLabel])

  const outsourceColumns: TableColumnsType<OutsourceRow> = [
    {
      title: 'Reference',
      key: 'reference',
      width: 150,
      render: (_, row) =>
        row.kind === 'challan' ? (
          <div>
            <span className="cf-challan-pill">{row.challan.challanNumber}</span>
            <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
              {formatDateTime(row.challan.challanDate)}
            </div>
          </div>
        ) : (
          <div style={{ color: '#94A3B8', fontSize: 13 }}>
            Not dispatched
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {formatDateTime(row.request.requestedAt)}
            </div>
          </div>
        ),
    },
    {
      title: 'Vendor',
      key: 'vendor',
      width: 170,
      render: (_, row) =>
        row.kind === 'challan' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShopOutlined style={{ color: '#64748B' }} />
            <strong style={{ color: '#0F172A' }}>{row.challan.destinationPartyName}</strong>
          </div>
        ) : (
          <span style={{ color: '#94A3B8' }}>Not assigned</span>
        ),
    },
    {
      title: 'Outsourced Work',
      key: 'work',
      render: (_, row) => {
        if (row.kind === 'request') {
          return (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {jobCardLabel(row.request.jobCardId)}
              </div>
              <Tag color="cyan" style={{ marginTop: 4 }}>
                {row.request.processName}
              </Tag>
            </div>
          )
        }

        const first = row.challan.items[0]
        if (!first) return '—'

        return (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{jobCardLabel(first.jobCardId)}</div>
            <Tag color="cyan" style={{ marginTop: 4 }}>
              {first.processName}
            </Tag>
            {row.challan.items.length > 1 && (
              <span style={{ fontSize: 11, color: '#0289C3' }}>
                +{row.challan.items.length - 1} more
              </span>
            )}
          </div>
        )
      },
    },
    {
      title: 'Qty',
      key: 'qty',
      width: 160,
      render: (_, row) => {
        if (row.kind === 'request') {
          return (
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 600 }}>{row.request.requestedQty} pcs requested</div>
              <Tag color="warning" style={{ marginTop: 4, fontWeight: 600 }}>
                {row.request.pendingQty} pcs pending
              </Tag>
            </div>
          )
        }

        const totalDisp = row.challan.items.reduce((s, it) => s + Number(it.dispatchedQty || 0), 0)
        const totalRecv = row.challan.items.reduce((s, it) => s + Number(it.receivedQty || 0), 0)
        const pct = totalDisp > 0 ? Math.round((totalRecv / totalDisp) * 100) : 100

        return (
          <div style={{ width: 130 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                fontWeight: 600,
                marginBottom: 2,
              }}
            >
              <span>
                {totalRecv} / {totalDisp}
              </span>
              <span>{pct}%</span>
            </div>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={pct === 100 ? '#10B981' : '#0289C3'}
            />
          </div>
        )
      },
    },
    {
      title: 'Total Amount',
      key: 'totalAmt',
      width: 120,
      render: (_, row) => {
        if (row.kind === 'request') return <span style={{ color: '#94A3B8' }}>—</span>

        const amt = row.challan.items.reduce(
          (s, it) => s + Number(it.amount || Number(it.rate || 0) * Number(it.dispatchedQty || 0)),
          0,
        )
        return (
          <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'Space Grotesk' }}>
            ₹{amt.toLocaleString()}
          </span>
        )
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, row) =>
        row.kind === 'request' ? (
          <Tag color="default" style={{ fontWeight: 600 }}>
            Pending
          </Tag>
        ) : (
          <StatusBadge status={row.challan.status} />
        ),
    },
  ]

  return (
    <div className="cf-outsource-container">
      {/* Page Header */}
      <PageHeader
        title="Outsource"
        subtitle="Manage vendor subcontracting challans, dispatch logs, and returned goods reconciliation"
        breadcrumbs={[{ label: 'Production' }, { label: 'Outsource' }]}
        actions={
          <Space>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => {
                refetchChallans()
                refetchRequests()
              }}
              style={{ borderRadius: 8 }}
            >
              Refresh
            </Button>
          </Space>
        }
      />

      {/* ====================================================================
          2. OUTSOURCE LEDGER — requests and the challans they became
          ==================================================================== */}
      <Card className="cf-outsource-main-card">
        <div className="cf-outsource-filter-bar">
          <div className="cf-filter-bar-left">
            <Input
              placeholder="Search by Challan #, Vendor, or Job Card..."
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
              className="cf-filter-search"
            />

            <Segmented
              value={statusFilter}
              onChange={val => setStatusFilter(String(val))}
              options={[
                { label: `All (${rows.length})`, value: 'all' },
                { label: `Pending (${pendingRequests.length})`, value: 'pending' },
                { label: `Open (${openCount})`, value: 'open' },
                { label: `Received (${receivedCount})`, value: 'received' },
                { label: `Closed (${closedCount})`, value: 'closed' },
              ]}
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchQuery || statusFilter !== 'all'
                ? 'Nothing matches the current filter or search criteria.'
                : 'No outsource requests or challans yet. Raise a request from a job card process.'
            }
            style={{ padding: '40px 0' }}
          >
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </Empty>
        ) : (
          <DataTable<OutsourceRow>
            columns={outsourceColumns}
            dataSource={filteredRows}
            rowKey="key"
            loading={challansLoading || requestsLoading}
            pagination={{ pageSize: 15 }}
            totalLabel="records"
            scroll={{ x: 'max-content' }}
            rowActions={row =>
              row.kind === 'request' ? requestActions(row.request) : challanActions(row.challan)
            }
          />
        )}
      </Card>

      {/* ====================================================================
          3. SLIDE-OUT DETAIL DRAWER (FOR TABLE VIEW)
          ==================================================================== */}
      <Drawer
        open={!!drawerChallan}
        onClose={() => setDrawerChallanId(undefined)}
        title={
          drawerChallan ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="cf-challan-pill">{drawerChallan.challanNumber}</span>
              <span>Challan Details</span>
            </div>
          ) : (
            'Challan Details'
          )
        }
        width={680}
        extra={
          drawerChallan && (
            <Space>
              {drawerChallan.status === 'received' && canModify && (
                <>
                  <Button
                    size="small"
                    icon={<LockOutlined />}
                    loading={closing && closingId === drawerChallan.id}
                    onClick={() => handleClose(drawerChallan.id)}
                  >
                    Close Challan
                  </Button>
                  <Button
                    size="small"
                    icon={<UndoOutlined />}
                    loading={unreceiving && unreceivingId === drawerChallan.id}
                    onClick={() => handleUnmarkReceived(drawerChallan.id)}
                  >
                    Undo Receive
                  </Button>
                </>
              )}
              {drawerChallan.status === 'open' && canDelete && (
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteChallan(drawerChallan)}
                >
                  Delete
                </Button>
              )}
            </Space>
          )
        }
      >
        {drawerChallan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Summary Metadata */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                padding: 16,
                background: '#F8FAFC',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>VENDOR</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  {drawerChallan.destinationPartyName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>CHALLAN DATE</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                  {drawerChallan.challanDate}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>STATUS</div>
                <div style={{ marginTop: 2 }}>
                  <StatusBadge status={drawerChallan.status} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>TOTAL ITEMS</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0289C3' }}>
                  {drawerChallan.items.length} item(s)
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 10,
                  color: '#0F172A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Outsourced Items & Acceptance
              </div>

              <DataTable<ChallanItem>
                dataSource={drawerChallan.items}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Job Card',
                    key: 'jobCard',
                    render: (_, it) => (
                      <span style={{ fontWeight: 600 }}>{jobCardLabel(it.jobCardId)}</span>
                    ),
                  },
                  {
                    title: 'Process',
                    dataIndex: 'processName',
                    key: 'processName',
                    width: 100,
                    render: v => <Tag color="cyan">{v}</Tag>,
                  },
                  {
                    title: 'Dispatched',
                    dataIndex: 'dispatchedQty',
                    key: 'disp',
                    width: 90,
                    align: 'center',
                  },
                  {
                    title: 'Received',
                    dataIndex: 'receivedQty',
                    key: 'recv',
                    width: 90,
                    align: 'center',
                    render: v => <span style={{ color: '#16A34A', fontWeight: 600 }}>{v}</span>,
                  },
                  {
                    title: 'Pending',
                    dataIndex: 'outstandingQty',
                    key: 'out',
                    width: 90,
                    align: 'center',
                    render: v => (
                      <span style={{ color: v > 0 ? '#D97706' : '#64748B', fontWeight: 600 }}>
                        {v}
                      </span>
                    ),
                  },
                  {
                    title: 'Action',
                    key: 'act',
                    width: 110,
                    align: 'right',
                    render: (_, item) => {
                      const isFullyReceived =
                        Number(item.outstandingQty) <= 0 ||
                        (Number(item.receivedQty) >= Number(item.dispatchedQty) &&
                          Number(item.dispatchedQty) > 0) ||
                        drawerChallan.status === 'closed'

                      if (isFullyReceived) {
                        return (
                          <Tag color="success" icon={<CheckOutlined />}>
                            Accepted
                          </Tag>
                        )
                      }

                      // Still outstanding, but this user may not record receipts.
                      return !canModify ? (
                        <span style={{ color: '#94A3B8' }}>—</span>
                      ) : (
                        <Button
                          size="small"
                          type="primary"
                          icon={<InboxOutlined />}
                          onClick={() => setAcceptTarget({ challan: drawerChallan, item })}
                        >
                          Accept
                        </Button>
                      )
                    },
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Challan — seeded with the row acted on, other pending requests
          can be bundled onto the same vendor challan from inside. */}
      <CreateChallanDrawer
        open={createChallanOpen}
        onClose={() => {
          setCreateChallanOpen(false)
          setSeedRequestId(undefined)
        }}
        requests={pendingRequests}
        seedRequestId={seedRequestId}
        jobCardLabel={jobCardLabel}
      />

      {/* Accept Returned Goods Modal */}
      <AcceptChallanItemModal
        open={!!acceptTarget}
        onClose={() => setAcceptTarget(undefined)}
        challan={acceptTarget?.challan}
        item={acceptTarget?.item}
        jobCardLabel={acceptTarget ? jobCardLabel(acceptTarget.item.jobCardId) : ''}
      />
    </div>
  )
}

import {
  App,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Progress,
  Radio,
  Segmented,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'antd'
import type { TableColumnsType } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ExportOutlined,
  EyeOutlined,
  InboxOutlined,
  LockOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AcceptChallanItemModal } from '../components/AcceptChallanItemModal'
import { CreateChallanModal } from '../components/CreateChallanModal'
import { usePendingChallanRequests } from '../hooks/useChallanRequests'
import {
  useAllChallans,
  useCloseChallan,
  useMarkChallanReceived,
} from '../hooks/useJobCardChallans'
import { useJobCards } from '../hooks/useJobCards'
import type { Challan, ChallanItem, ChallanRequest, ChallanStatus } from '@/types/production'
import { getErrorMessage } from '@/api/client'
import './Outsource.css'

export const OutsourceList = () => {
  const { message } = App.useApp()
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
  const { mutateAsync: markReceived, isPending: markingReceived } = useMarkChallanReceived()
  const { mutateAsync: closeChallanMutation, isPending: closing } = useCloseChallan()

  const [activeTab, setActiveTab] = useState<'challans' | 'pending'>('challans')
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [createChallanOpen, setCreateChallanOpen] = useState(false)
  const [acceptTarget, setAcceptTarget] = useState<{ challan: Challan; item: ChallanItem }>()

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [drawerChallan, setDrawerChallan] = useState<Challan | undefined>()

  const handleMarkReceived = async (challanId: string) => {
    try {
      await markReceived(challanId)
      message.success('Challan marked as received at factory gate')
      if (drawerChallan?.id === challanId) {
        setDrawerChallan(prev => (prev ? { ...prev, status: 'received' } : undefined))
      }
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const handleClose = async (challanId: string) => {
    try {
      await closeChallanMutation(challanId)
      message.success('Challan reconciled and closed successfully')
      if (drawerChallan?.id === challanId) {
        setDrawerChallan(prev => (prev ? { ...prev, status: 'closed' } : undefined))
      }
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const jobCardsById = useMemo(() => new Map(jobCards.map(jc => [jc.id, jc])), [jobCards])
  const jobCardLabel = (jobCardId: string) => {
    const jc = jobCardsById.get(jobCardId)
    return jc ? `${jc.jobCardNumber} · ${jc.itemName}` : jobCardId
  }

  const selectedRequests = pendingRequests.filter(r => selectedRequestIds.includes(r.id))

  // KPI telemetry summary calculations
  const openCount = useMemo(() => challans.filter(c => c.status === 'open').length, [challans])
  const receivedCount = useMemo(
    () => challans.filter(c => c.status === 'received').length,
    [challans],
  )
  const closedCount = useMemo(() => challans.filter(c => c.status === 'closed').length, [challans])

  // Filtered Challans
  const filteredChallans = useMemo(() => {
    return challans.filter(c => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        c.challanNumber.toLowerCase().includes(q) ||
        c.destinationPartyName.toLowerCase().includes(q) ||
        c.items.some(
          it =>
            it.processName.toLowerCase().includes(q) ||
            jobCardLabel(it.jobCardId).toLowerCase().includes(q),
        )

      if (!matchesSearch) return false

      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [challans, searchQuery, statusFilter, jobCardsById])

  // Columns for Pending Requests DataTable
  const requestColumns: TableColumnsType<ChallanRequest> = [
    {
      title: 'Job Card',
      key: 'jobCard',
      render: (_, r) => (
        <span style={{ fontWeight: 600, color: '#0F172A' }}>{jobCardLabel(r.jobCardId)}</span>
      ),
    },
    {
      title: 'Process',
      dataIndex: 'processName',
      key: 'processName',
      width: 170,
      render: v => <Tag color="cyan">{v}</Tag>,
    },
    {
      title: 'Requested Qty',
      dataIndex: 'requestedQty',
      key: 'requestedQty',
      width: 130,
      render: v => <span style={{ fontWeight: 600 }}>{v} pcs</span>,
    },
    {
      title: 'Dispatched',
      dataIndex: 'dispatchedQty',
      key: 'dispatchedQty',
      width: 120,
      render: v => <span style={{ color: '#64748B' }}>{v} pcs</span>,
    },
    {
      title: 'Pending Qty',
      dataIndex: 'pendingQty',
      key: 'pendingQty',
      width: 130,
      render: v => (
        <Tag color={v > 0 ? 'warning' : 'default'} style={{ fontWeight: 700 }}>
          {v} pcs pending
        </Tag>
      ),
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedByName',
      key: 'requestedByName',
      render: v => v || '—',
    },
    {
      title: 'Date',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 120,
      render: v => (v ? String(v).slice(0, 10) : '—'),
    },
  ]

  // Columns for Compact Table View of Challans
  const compactChallanColumns: TableColumnsType<Challan> = [
    {
      title: 'Challan No',
      dataIndex: 'challanNumber',
      key: 'challanNumber',
      width: 140,
      render: v => <span className="cf-challan-pill">{v}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'challanDate',
      key: 'challanDate',
      width: 110,
      render: v => <span style={{ color: '#64748B', fontSize: 13 }}>{v}</span>,
    },
    {
      title: 'Vendor Name',
      dataIndex: 'destinationPartyName',
      key: 'destinationPartyName',
      render: v => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShopOutlined style={{ color: '#64748B' }} />
          <strong style={{ color: '#0F172A' }}>{v}</strong>
        </div>
      ),
    },
    {
      title: 'Outsourced Items',
      key: 'itemsSummary',
      render: (_, c) => {
        const first = c.items[0]
        if (!first) return '—'
        const label = `${jobCardLabel(first.jobCardId)} (${first.processName})`
        return (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
            {c.items.length > 1 && (
              <span style={{ fontSize: 11, color: '#0289C3' }}>
                +{c.items.length - 1} more item(s)
              </span>
            )}
          </div>
        )
      },
    },
    {
      title: 'Dispatched / Recv',
      key: 'qtyRatio',
      width: 160,
      render: (_, c) => {
        const totalDisp = c.items.reduce((s, it) => s + Number(it.dispatchedQty || 0), 0)
        const totalRecv = c.items.reduce((s, it) => s + Number(it.receivedQty || 0), 0)
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
      render: (_, c) => {
        const amt = c.items.reduce(
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
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ChallanStatus) => <StatusBadge status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      align: 'right',
      render: (_, c) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDrawerChallan(c)}
            style={{ borderRadius: 6 }}
          >
            Details
          </Button>

          {c.status === 'open' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              loading={markingReceived}
              onClick={() => handleMarkReceived(c.id)}
              style={{ borderRadius: 6 }}
            >
              Receive
            </Button>
          )}

          {c.status === 'received' && (
            <Button
              size="small"
              icon={<LockOutlined />}
              loading={closing}
              onClick={() => handleClose(c.id)}
              style={{ borderRadius: 6 }}
            >
              Close
            </Button>
          )}
        </Space>
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
            {activeTab === 'pending' && selectedRequestIds.length > 0 && (
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={() => setCreateChallanOpen(true)}
                style={{ borderRadius: 8 }}
              >
                Create Challan ({selectedRequestIds.length})
              </Button>
            )}
          </Space>
        }
      />

      {/* ====================================================================
          2. MAIN TABBED WORKSPACE
          ==================================================================== */}
      <Card className="cf-outsource-main-card">
        <Tabs
          activeKey={activeTab}
          onChange={k => setActiveTab(k as 'challans' | 'pending')}
          tabBarExtraContent={
            activeTab === 'pending' ? (
              <Tooltip
                title={selectedRequestIds.length === 0 ? 'Select requests to bundle' : undefined}
              >
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  disabled={selectedRequestIds.length === 0}
                  onClick={() => setCreateChallanOpen(true)}
                  style={{ borderRadius: 8 }}
                >
                  Create Challan ({selectedRequestIds.length})
                </Button>
              </Tooltip>
            ) : null
          }
          items={[
            {
              key: 'challans',
              label: `Outsource Challans (${challans.length})`,
              children: (
                <div>
                  {/* Search and Filters Bar */}
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
                          { label: `All (${challans.length})`, value: 'all' },
                          { label: `Open (${openCount})`, value: 'open' },
                          { label: `Received (${receivedCount})`, value: 'received' },
                          { label: `Closed (${closedCount})`, value: 'closed' },
                        ]}
                      />
                    </div>

                    <div className="cf-filter-bar-right">
                      <Radio.Group
                        value={viewMode}
                        onChange={e => setViewMode(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                        size="small"
                      >
                        <Radio.Button value="cards">
                          <AppstoreOutlined /> Cards
                        </Radio.Button>
                        <Radio.Button value="table">
                          <UnorderedListOutlined /> Table
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                  </div>

                  {/* Empty State */}
                  {filteredChallans.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        searchQuery || statusFilter !== 'all'
                          ? 'No challans match the current filter or search criteria.'
                          : 'No outsource challans created yet. Select pending requests to create one.'
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
                  ) : viewMode === 'table' ? (
                    /* -----------------------------------------------------------------
                       VIEW A: CLEAN COMPACT TABULAR VIEW
                       ----------------------------------------------------------------- */
                    <DataTable<Challan>
                      columns={compactChallanColumns}
                      dataSource={filteredChallans}
                      rowKey="id"
                      loading={challansLoading}
                      pagination={{ pageSize: 15 }}
                      totalLabel="challans"
                    />
                  ) : (
                    /* -----------------------------------------------------------------
                       VIEW B: EXECUTIVE DOCUMENT CARDS (CLEAR & HIGH-LEGIBILITY)
                       ----------------------------------------------------------------- */
                    <div className="cf-challans-stack">
                      {filteredChallans.map(challan => {
                        const totalDisp = challan.items.reduce(
                          (s, it) => s + Number(it.dispatchedQty || 0),
                          0,
                        )
                        const totalRecv = challan.items.reduce(
                          (s, it) => s + Number(it.receivedQty || 0),
                          0,
                        )
                        const totalOut = challan.items.reduce(
                          (s, it) => s + Number(it.outstandingQty || 0),
                          0,
                        )
                        const totalAmt = challan.items.reduce(
                          (s, it) =>
                            s +
                            Number(
                              it.amount || Number(it.rate || 0) * Number(it.dispatchedQty || 0),
                            ),
                          0,
                        )
                        const pct =
                          totalDisp > 0
                            ? Math.min(100, Math.round((totalRecv / totalDisp) * 100))
                            : 100

                        return (
                          <div key={challan.id} className="cf-challan-card">
                            {/* Card Header */}
                            <div className="cf-challan-header">
                              <div className="cf-challan-identity">
                                <span className="cf-challan-pill">{challan.challanNumber}</span>
                                <div className="cf-challan-vendor-tag">
                                  <ShopOutlined className="cf-vendor-ico" />
                                  <span>{challan.destinationPartyName}</span>
                                </div>
                                <div className="cf-challan-date-tag">
                                  <CalendarOutlined />
                                  <span>{challan.challanDate}</span>
                                </div>
                              </div>

                              <div className="cf-challan-actions-cluster">
                                <StatusBadge status={challan.status} />

                                {challan.status === 'open' && (
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckOutlined />}
                                    loading={markingReceived}
                                    onClick={() => handleMarkReceived(challan.id)}
                                    style={{ borderRadius: 6, fontWeight: 600 }}
                                  >
                                    Mark Received
                                  </Button>
                                )}

                                {challan.status === 'received' && (
                                  <Button
                                    size="small"
                                    icon={<LockOutlined />}
                                    loading={closing}
                                    onClick={() => handleClose(challan.id)}
                                    style={{ borderRadius: 6, fontWeight: 600 }}
                                  >
                                    Close Challan
                                  </Button>
                                )}

                                {challan.status === 'closed' && (
                                  <Tag
                                    color="success"
                                    icon={<CheckCircleOutlined />}
                                    style={{ margin: 0, padding: '2px 8px', borderRadius: 6 }}
                                  >
                                    Reconciled
                                  </Tag>
                                )}
                              </div>
                            </div>

                            {/* Summary Bar */}
                            <div className="cf-challan-stats-bar">
                              <div className="cf-challan-metric-items">
                                <div className="cf-mini-stat">
                                  <span className="cf-mini-label">Items</span>
                                  <span className="cf-mini-val">{challan.items.length}</span>
                                </div>
                                <div className="cf-mini-stat">
                                  <span className="cf-mini-label">Dispatched</span>
                                  <span className="cf-mini-val">{totalDisp} pcs</span>
                                </div>
                                <div className="cf-mini-stat">
                                  <span className="cf-mini-label">Received</span>
                                  <span className="cf-mini-val cf-val-green">{totalRecv} pcs</span>
                                </div>
                                <div className="cf-mini-stat">
                                  <span className="cf-mini-label">Outstanding</span>
                                  <span
                                    className={`cf-mini-val ${totalOut > 0 ? 'cf-val-amber' : ''}`}
                                  >
                                    {totalOut} pcs
                                  </span>
                                </div>
                                <div className="cf-mini-stat">
                                  <span className="cf-mini-label">Total Cost</span>
                                  <span className="cf-mini-val cf-val-highlight">
                                    ₹{totalAmt.toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <div className="cf-challan-progress-col">
                                <div className="cf-progress-text-row">
                                  <span>Fulfillment</span>
                                  <span>{pct}%</span>
                                </div>
                                <Progress
                                  percent={pct}
                                  showInfo={false}
                                  strokeColor={pct === 100 ? '#10B981' : '#0289C3'}
                                  size="small"
                                />
                              </div>
                            </div>

                            {/* Items Section */}
                            <div className="cf-challan-items-wrap">
                              <div className="cf-items-section-title">
                                <ShoppingOutlined /> Dispatched Work Breakdown
                              </div>

                              {challan.items.map(item => {
                                const isFullyReceived =
                                  Number(item.outstandingQty) <= 0 ||
                                  (Number(item.receivedQty) >= Number(item.dispatchedQty) &&
                                    Number(item.dispatchedQty) > 0) ||
                                  challan.status === 'closed'

                                return (
                                  <div key={item.id} className="cf-challan-item-row">
                                    <div className="cf-item-col-jobcard">
                                      <span className="cf-item-jobcard-name">
                                        {jobCardLabel(item.jobCardId)}
                                      </span>
                                      <Tag color="cyan" className="cf-item-process-tag">
                                        {item.processName}
                                      </Tag>
                                    </div>

                                    <div className="cf-item-col-quantities">
                                      <div className="cf-qty-pill">
                                        <span className="cf-qty-pill-label">Dispatched</span>
                                        <span className="cf-qty-pill-num">
                                          {item.dispatchedQty}
                                        </span>
                                      </div>
                                      <div className="cf-qty-pill cf-qty-pill-received">
                                        <span className="cf-qty-pill-label">Received</span>
                                        <span className="cf-qty-pill-num">{item.receivedQty}</span>
                                      </div>
                                      <div className="cf-qty-pill cf-qty-pill-pending">
                                        <span className="cf-qty-pill-label">Outstanding</span>
                                        <span className="cf-qty-pill-num">
                                          {item.outstandingQty}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="cf-item-col-commercials">
                                      <span className="cf-rate-text">₹{item.rate ?? 0} / unit</span>
                                      <span className="cf-amount-text">
                                        ₹
                                        {(
                                          item.amount ??
                                          Number(item.rate || 0) * Number(item.dispatchedQty || 0)
                                        ).toLocaleString()}
                                      </span>
                                    </div>

                                    <div className="cf-item-col-action">
                                      {isFullyReceived ? (
                                        <Tag
                                          color="success"
                                          icon={<CheckOutlined />}
                                          style={{
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            fontWeight: 600,
                                          }}
                                        >
                                          Accepted
                                        </Tag>
                                      ) : (
                                        <Button
                                          type="primary"
                                          size="small"
                                          icon={<InboxOutlined />}
                                          onClick={() => setAcceptTarget({ challan, item })}
                                          style={{ borderRadius: 6, fontWeight: 600 }}
                                        >
                                          Accept Goods
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'pending',
              label: `Pending Requests (${pendingRequests.length})`,
              children: (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#475569' }}>
                      Select production job card operations to generate an outgoing vendor challan.
                    </span>

                    {selectedRequestIds.length > 0 && (
                      <Tag color="processing" style={{ fontWeight: 600 }}>
                        {selectedRequestIds.length} request(s) selected
                      </Tag>
                    )}
                  </div>

                  <DataTable<ChallanRequest>
                    columns={requestColumns}
                    dataSource={pendingRequests}
                    rowKey="id"
                    loading={requestsLoading}
                    pagination={false}
                    totalLabel="pending requests"
                    rowSelection={{
                      selectedRowKeys: selectedRequestIds,
                      onChange: keys => setSelectedRequestIds(keys as string[]),
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* ====================================================================
          3. SLIDE-OUT DETAIL DRAWER (FOR TABLE VIEW)
          ==================================================================== */}
      <Drawer
        open={!!drawerChallan}
        onClose={() => setDrawerChallan(undefined)}
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
              {drawerChallan.status === 'open' && (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  loading={markingReceived}
                  onClick={() => handleMarkReceived(drawerChallan.id)}
                >
                  Mark Received
                </Button>
              )}
              {drawerChallan.status === 'received' && (
                <Button
                  size="small"
                  icon={<LockOutlined />}
                  loading={closing}
                  onClick={() => handleClose(drawerChallan.id)}
                >
                  Close Challan
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

              <Table<ChallanItem>
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

                      return isFullyReceived ? (
                        <Tag color="success" icon={<CheckOutlined />}>
                          Accepted
                        </Tag>
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

      {/* Create Challan Modal */}
      <CreateChallanModal
        open={createChallanOpen}
        onClose={() => {
          setCreateChallanOpen(false)
          setSelectedRequestIds([])
        }}
        requests={selectedRequests}
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

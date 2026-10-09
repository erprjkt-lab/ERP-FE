import {
  ApartmentOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TruckOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Alert, Button, Col, Input, Row, Skeleton, Tag } from 'antd'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '@/api/client'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  CATEGORICAL,
  DonutChart,
  Meter,
  severityColor,
} from '@/modules/dashboard/components/DashboardCharts'
import { useDashboard } from '@/modules/dashboard/hooks/useDashboard'
import { useAuthStore } from '@/store/authStore'
import { usePermissionStore } from '@/store/permissionStore'
import type { LowStockRow } from '@/types/dashboard'
import './Dashboard.css'

export const Dashboard: FC = () => {
  const navigate = useNavigate()
  const userName = useAuthStore(state => state.user?.name) ?? 'Admin'
  const hasPermission = usePermissionStore(state => state.hasPermission)
  const { widgets, isLoading, isFetching, error, refetch } = useDashboard()

  const [stockSearch, setStockSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'critical' | 'reorder'>('all')

  const canViewStock = hasPermission('read stock')
  const canViewGrn = hasPermission('read grn')
  const canViewJobCards = hasPermission('read job-cards')
  const canViewSalesOrders = hasPermission('read sales-orders')

  // Filtered low stock rows
  const filteredStock = useMemo(() => {
    const list = widgets.lowStock ?? []
    return list.filter((row: LowStockRow) => {
      const matchesSearch = row.itemName.toLowerCase().includes(stockSearch.toLowerCase())
      if (!matchesSearch) return false

      const ratio = row.qty / Math.max(row.reorderLevel, 1)
      if (stockFilter === 'critical') return ratio < 0.25 || row.qty === 0
      if (stockFilter === 'reorder') return ratio >= 0.25 && ratio <= 0.75
      return true
    })
  }, [widgets.lowStock, stockSearch, stockFilter])

  // Count critical items (qty === 0 or < 25%)
  const criticalStockCount = useMemo(() => {
    return (widgets.lowStock ?? []).filter(
      r => r.qty === 0 || r.qty / Math.max(r.reorderLevel, 1) < 0.25,
    ).length
  }, [widgets.lowStock])

  // Total active job cards count
  const totalJobCards = useMemo(() => {
    return (widgets.jobCardStages ?? []).reduce((acc, curr) => acc + curr.count, 0)
  }, [widgets.jobCardStages])

  return (
    <div className="cf-dashboard-wrapper">
      <PageHeader
        title="Dashboard"
        subtitle={userName ? `Welcome back, ${userName}` : undefined}
        actions={
          <Button
            icon={<ReloadOutlined spin={isFetching} />}
            onClick={() => refetch()}
            style={{ borderRadius: 8, height: 32 }}
          >
            Refresh
          </Button>
        }
      />

      {/* A failed load must not render as an all-clear factory — the empty states
          below read as "nothing pending", which is the opposite of "unknown". */}
      {error ? (
        <Alert
          type="error"
          showIcon
          message="Could not load dashboard"
          description={getErrorMessage(error, 'Please retry, or contact your administrator.')}
          action={
            <Button size="small" onClick={() => refetch()} loading={isFetching}>
              Retry
            </Button>
          }
        />
      ) : (
        <>
          {/* ==================================================================
          2. HIGH-IMPACT TELEMETRY KPI METRIC CARDS
          ================================================================== */}
          <section className="cf-kpi-grid" aria-label="Key Performance Indicators">
            {/* KPI 1: Low Stock Items */}
            {canViewStock && (
              <div
                className="cf-kpi-card cf-kpi-stock"
                onClick={() => navigate('/inventory/stock-balance')}
                title="View detailed stock ledger"
              >
                <div className="cf-kpi-card-top-bar" />
                <div className="cf-kpi-header">
                  <span className="cf-kpi-title">Low Stock Items</span>
                  <div className="cf-kpi-icon-box">
                    <WarningOutlined />
                  </div>
                </div>

                <div className="cf-kpi-body">
                  <span className="cf-kpi-number">{widgets.lowStock?.length ?? 0}</span>
                  {criticalStockCount > 0 ? (
                    <span className="cf-kpi-tag cf-tag-danger">{criticalStockCount} Critical</span>
                  ) : (
                    <span className="cf-kpi-tag cf-tag-warning">Action Needed</span>
                  )}
                </div>

                <div className="cf-kpi-footer">
                  <span>Below safety reorder level</span>
                  <span className="cf-kpi-link-text">
                    Ledger <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                </div>
              </div>
            )}

            {/* KPI 2: Pending QC */}
            {canViewGrn && (
              <div
                className="cf-kpi-card cf-kpi-qc"
                onClick={() => navigate('/purchase/grn')}
                title="View pending inward inspection reports"
              >
                <div className="cf-kpi-card-top-bar" />
                <div className="cf-kpi-header">
                  <span className="cf-kpi-title">Pending QC Audits</span>
                  <div className="cf-kpi-icon-box">
                    <SafetyCertificateOutlined />
                  </div>
                </div>

                <div className="cf-kpi-body">
                  <span className="cf-kpi-number">{widgets.pendingQc?.length ?? 0}</span>
                  <span className="cf-kpi-tag cf-tag-warning">Inward GRN</span>
                </div>

                <div className="cf-kpi-footer">
                  <span>Awaiting QA acceptance</span>
                  <span className="cf-kpi-link-text">
                    Inspect <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                </div>
              </div>
            )}

            {/* KPI 3: Overdue Jobs */}
            {canViewJobCards && (
              <div
                className="cf-kpi-card cf-kpi-jobs"
                onClick={() => navigate('/production/entries')}
                title="View active shop floor entries"
              >
                <div className="cf-kpi-card-top-bar" />
                <div className="cf-kpi-header">
                  <span className="cf-kpi-title">Overdue Job Cards</span>
                  <div className="cf-kpi-icon-box">
                    <ClockCircleOutlined />
                  </div>
                </div>

                <div className="cf-kpi-body">
                  <span className="cf-kpi-number">{widgets.overdueJobs?.length ?? 0}</span>
                  {(widgets.overdueJobs?.length ?? 0) > 0 ? (
                    <span className="cf-kpi-tag cf-tag-danger">Past Due</span>
                  ) : (
                    <span className="cf-kpi-tag cf-tag-success">On Schedule</span>
                  )}
                </div>

                <div className="cf-kpi-footer">
                  <span>Shop floor production line</span>
                  <span className="cf-kpi-link-text">
                    Jobs <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                </div>
              </div>
            )}

            {/* KPI 4: Pending Deliveries */}
            {canViewSalesOrders && (
              <div
                className="cf-kpi-card cf-kpi-deliveries"
                onClick={() => navigate('/sales/delivery-challans')}
                title="View delivery challans & dispatch"
              >
                <div className="cf-kpi-card-top-bar" />
                <div className="cf-kpi-header">
                  <span className="cf-kpi-title">Pending Deliveries</span>
                  <div className="cf-kpi-icon-box">
                    <TruckOutlined />
                  </div>
                </div>

                <div className="cf-kpi-body">
                  <span className="cf-kpi-number">{widgets.pendingDeliveries?.length ?? 0}</span>
                  {(widgets.pendingDeliveries?.length ?? 0) === 0 ? (
                    <span className="cf-kpi-tag cf-tag-success">100% Fulfilled</span>
                  ) : (
                    <span className="cf-kpi-tag cf-tag-warning">To Dispatch</span>
                  )}
                </div>

                <div className="cf-kpi-footer">
                  <span>Client shipment status</span>
                  <span className="cf-kpi-link-text">
                    Dispatch <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ==================================================================
          3. HERO OPERATIONS GRID: PRODUCTION STAGES & LOW STOCK WATCHLIST
          ================================================================== */}
          <Row gutter={[20, 20]}>
            {/* Production Job Cards Flow */}
            {canViewJobCards && (
              <Col xs={24} lg={12}>
                <div className="cf-dash-card">
                  <div className="cf-dash-card-header">
                    <div className="cf-card-title-group">
                      <div
                        className="cf-card-icon-badge"
                        style={{ background: 'rgba(0, 160, 227, 0.1)', color: '#00A0E3' }}
                      >
                        <ApartmentOutlined />
                      </div>
                      <h3>Shopfloor Job Cards by Stage</h3>
                    </div>

                    <Link to="/production/entries" className="cf-card-extra-action">
                      <span>View All ({totalJobCards})</span>
                      <ArrowRightOutlined style={{ fontSize: 10 }} />
                    </Link>
                  </div>

                  <div className="cf-dash-card-body">
                    {isLoading ? (
                      <Skeleton active paragraph={{ rows: 5 }} />
                    ) : (
                      <div className="cf-production-content">
                        {/* Donut Chart and Interactive Stages */}
                        <div className="cf-donut-wrapper">
                          {widgets.jobCardStages && (
                            <DonutChart
                              data={widgets.jobCardStages.map(s => ({
                                label: s.label,
                                value: s.count,
                              }))}
                              centerLabel="Active Jobs"
                              colors={[
                                CATEGORICAL.orange,
                                CATEGORICAL.blue,
                                CATEGORICAL.aqua,
                                CATEGORICAL.yellow,
                                CATEGORICAL.magenta,
                              ]}
                            />
                          )}
                        </div>

                        {/* Integrated Overdue Job Card Alert */}
                        {(widgets.overdueJobs?.length ?? 0) > 0 && (
                          <div className="cf-overdue-banner">
                            <div className="cf-overdue-info">
                              <ClockCircleOutlined className="cf-overdue-icon" />
                              <div>
                                <div className="cf-overdue-text">
                                  Job Card #{widgets.overdueJobs![0].jobCardNumber} is overdue
                                </div>
                                <div className="cf-overdue-sub">
                                  Target date: {widgets.overdueJobs![0].targetDate} (
                                  {widgets.overdueJobs![0].daysOverdue} days late)
                                </div>
                              </div>
                            </div>

                            <Button
                              size="small"
                              danger
                              onClick={() => navigate('/production/entries')}
                              style={{ borderRadius: 6, fontWeight: 600 }}
                            >
                              Expedite Job
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            )}

            {/* Low Stock & Reorder Watchlist */}
            {canViewStock && (
              <Col xs={24} lg={12}>
                <div className="cf-dash-card">
                  <div className="cf-dash-card-header">
                    <div className="cf-card-title-group">
                      <div
                        className="cf-card-icon-badge"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                      >
                        <WarningOutlined />
                      </div>
                      <div>
                        <h3>Inventory Reorder Watchlist</h3>
                      </div>
                    </div>

                    <Link to="/inventory/stock-balance" className="cf-card-extra-action">
                      <span>Stock Ledger</span>
                      <ArrowRightOutlined style={{ fontSize: 10 }} />
                    </Link>
                  </div>

                  <div className="cf-dash-card-body">
                    {/* Search & Filter Strip */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 14,
                      }}
                    >
                      <Input
                        size="small"
                        placeholder="Search material..."
                        prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                        value={stockSearch}
                        onChange={e => setStockSearch(e.target.value)}
                        allowClear
                        style={{ maxWidth: 180, borderRadius: 8 }}
                      />

                      <div className="cf-stock-filter-bar" style={{ marginBottom: 0 }}>
                        <button
                          type="button"
                          className={`cf-stock-filter-pill ${stockFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setStockFilter('all')}
                        >
                          All ({widgets.lowStock?.length ?? 0})
                        </button>
                        <button
                          type="button"
                          className={`cf-stock-filter-pill ${stockFilter === 'critical' ? 'active' : ''}`}
                          onClick={() => setStockFilter('critical')}
                        >
                          Critical ({criticalStockCount})
                        </button>
                        <button
                          type="button"
                          className={`cf-stock-filter-pill ${stockFilter === 'reorder' ? 'active' : ''}`}
                          onClick={() => setStockFilter('reorder')}
                        >
                          Reorder
                        </button>
                      </div>
                    </div>

                    {isLoading ? (
                      <Skeleton active paragraph={{ rows: 5 }} />
                    ) : (
                      <div className="cf-stock-scroll-list">
                        {filteredStock.length === 0 ? (
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '40px 0',
                              color: '#94A3B8',
                              fontSize: 13,
                            }}
                          >
                            No low-stock materials matching criteria.
                          </div>
                        ) : (
                          filteredStock.map(row => {
                            const ratio = row.qty / Math.max(row.reorderLevel, 1)
                            const color = severityColor(ratio)
                            const isCritical = ratio < 0.25 || row.qty === 0

                            return (
                              <div
                                key={`${row.itemId}-${row.locationId}`}
                                className="cf-stock-item-row"
                              >
                                <div className="cf-stock-item-top">
                                  <span className="cf-stock-name">{row.itemName}</span>
                                  <span
                                    className={`cf-stock-severity-pill ${
                                      row.qty === 0
                                        ? 'cf-severity-critical'
                                        : isCritical
                                          ? 'cf-severity-critical'
                                          : 'cf-severity-reorder'
                                    }`}
                                  >
                                    {row.qty === 0
                                      ? 'OUT OF STOCK'
                                      : isCritical
                                        ? 'CRITICAL DEFICIT'
                                        : 'REORDER LEVEL'}
                                  </span>
                                </div>

                                <div className="cf-stock-meta-row">
                                  <span>Available Stock vs Threshold</span>
                                  <span className="cf-stock-ratio-text">
                                    {row.qty} / {row.reorderLevel} units
                                  </span>
                                </div>

                                <Meter
                                  value={row.qty}
                                  max={row.reorderLevel}
                                  color={color}
                                  height={6}
                                />
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            )}
          </Row>

          {/* ==================================================================
          4. LOWER OPERATIONS: QUALITY CONTROL & CUSTOMER DISPATCH
          ================================================================== */}
          <Row gutter={[20, 20]}>
            {/* Pending Inward QC Inspection */}
            {canViewGrn && (
              <Col xs={24} lg={12}>
                <div className="cf-dash-card">
                  <div className="cf-dash-card-header">
                    <div className="cf-card-title-group">
                      <div
                        className="cf-card-icon-badge"
                        style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}
                      >
                        <SafetyCertificateOutlined />
                      </div>
                      <h3>Pending Inward Quality Audits (GRN)</h3>
                    </div>

                    <Link to="/purchase/grn" className="cf-card-extra-action">
                      <span>GRN Ledger</span>
                      <ArrowRightOutlined style={{ fontSize: 10 }} />
                    </Link>
                  </div>

                  <div className="cf-dash-card-body">
                    {isLoading ? (
                      <Skeleton active paragraph={{ rows: 3 }} />
                    ) : (widgets.pendingQc?.length ?? 0) === 0 ? (
                      <div className="cf-fulfilled-empty-box">
                        <div className="cf-fulfilled-icon">
                          <CheckCircleOutlined />
                        </div>
                        <h4 className="cf-fulfilled-title">Inward Quality Audits Clear</h4>
                        <p className="cf-fulfilled-sub">
                          All received goods have completed First Inspection Reports (FIR) and have
                          been accepted into inventory.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {widgets.pendingQc?.map(row => (
                          <div key={row.id} className="cf-qc-item-card">
                            <div className="cf-qc-main-info">
                              <span className="cf-qc-grn-no">{row.grnNo}</span>
                              <span className="cf-qc-supplier">
                                Supplier: <strong>{row.supplier ?? 'Unassigned'}</strong>
                              </span>
                              {row.grnDate && (
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                  Received on {row.grnDate}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Tag color={row.daysPending > 3 ? 'error' : 'warning'}>
                                {row.daysPending} {row.daysPending === 1 ? 'day' : 'days'} pending
                              </Tag>
                              <Button
                                type="primary"
                                size="small"
                                onClick={() => navigate('/quality/fir')}
                                style={{
                                  background: '#F59E0B',
                                  borderColor: 'transparent',
                                  borderRadius: 6,
                                  fontWeight: 600,
                                }}
                              >
                                Inspect GRN
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            )}

            {/* Pending Customer Deliveries */}
            {canViewSalesOrders && (
              <Col xs={24} lg={12}>
                <div className="cf-dash-card">
                  <div className="cf-dash-card-header">
                    <div className="cf-card-title-group">
                      <div
                        className="cf-card-icon-badge"
                        style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}
                      >
                        <TruckOutlined />
                      </div>
                      <h3>Customer Delivery Fulfillment</h3>
                    </div>

                    <Link to="/sales/delivery-challans" className="cf-card-extra-action">
                      <span>Challan Ledger</span>
                      <ArrowRightOutlined style={{ fontSize: 10 }} />
                    </Link>
                  </div>

                  <div className="cf-dash-card-body">
                    {isLoading ? (
                      <Skeleton active paragraph={{ rows: 3 }} />
                    ) : (widgets.pendingDeliveries?.length ?? 0) === 0 ? (
                      <div className="cf-fulfilled-empty-box">
                        <div className="cf-fulfilled-icon">
                          <CheckCircleOutlined />
                        </div>
                        <h4 className="cf-fulfilled-title">100% Fulfillment Complete</h4>
                        <p className="cf-fulfilled-sub">
                          Zero backlog on outgoing customer dispatches. All confirmed sales orders
                          have matching delivery challans.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {widgets.pendingDeliveries?.map(row => (
                          <div
                            key={row.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              background: '#F8FAFC',
                              borderRadius: 12,
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontFamily: 'IBM Plex Mono',
                                  fontWeight: 700,
                                  fontSize: 13.5,
                                }}
                              >
                                {row.orderNumber}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748B' }}>
                                Customer: <strong>{row.party ?? 'Unassigned'}</strong>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <Tag color="processing">{row.pendingQty} pcs pending</Tag>
                              <Button
                                size="small"
                                onClick={() => navigate('/sales/delivery-challans')}
                                style={{ borderRadius: 6, fontWeight: 600 }}
                              >
                                Dispatch
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </>
      )}
    </div>
  )
}

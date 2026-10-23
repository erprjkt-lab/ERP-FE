import {
  ApartmentOutlined,
  AuditOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { Empty } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { REPORT_CATEGORIES, REPORTS, type ReportCategory } from '@/modules/reports/reportRegistry'
import { usePermissionStore } from '@/store/permissionStore'
import './ReportsLanding.css'

const CATEGORY_ICONS: Record<ReportCategory, ReactNode> = {
  purchase: <ShoppingCartOutlined />,
  sales: <LineChartOutlined />,
  stock: <ShopOutlined />,
  production: <ApartmentOutlined />,
  quality: <SafetyCertificateOutlined />,
  system: <AuditOutlined />,
}

export default function ReportsLanding() {
  const navigate = useNavigate()
  const hasPermission = usePermissionStore(state => state.hasPermission)

  // Only reports this employee was granted — the same per-report permissions the
  // endpoints enforce, so a visible card never leads to a 403.
  const allowed = useMemo(() => REPORTS.filter(r => hasPermission(r.permission)), [hasPermission])

  const categories = useMemo(
    () => REPORT_CATEGORIES.filter(c => allowed.some(r => r.category === c.key)),
    [allowed],
  )

  const [active, setActive] = useState<ReportCategory | null>(null)
  const current = active && categories.some(c => c.key === active) ? active : categories[0]?.key

  if (allowed.length === 0) {
    return (
      <>
        <PageHeader title="Reports" subtitle="Exportable, drill-down operational reports" />
        <Empty description="You don't have access to any reports yet. Ask an administrator to grant them." />
      </>
    )
  }

  const visible = allowed.filter(r => r.category === current)

  return (
    <>
      <PageHeader title="Reports" subtitle="Exportable, drill-down operational reports" />

      <div className="erp-reports-layout">
        <nav className="erp-reports-rail" aria-label="Report categories">
          {categories.map(category => (
            <button
              key={category.key}
              type="button"
              className={`erp-reports-rail-item ${current === category.key ? 'is-active' : ''}`}
              onClick={() => setActive(category.key)}
            >
              <span className="erp-reports-rail-icon">{CATEGORY_ICONS[category.key]}</span>
              <span className="erp-reports-rail-label">{category.label}</span>
              <span className="erp-reports-rail-count">
                {allowed.filter(r => r.category === category.key).length}
              </span>
            </button>
          ))}
        </nav>

        <div className="erp-reports-grid">
          {visible.map(report => (
            <button
              key={report.slug}
              type="button"
              className="erp-report-card"
              onClick={() => navigate(`/reports/${report.slug}`)}
            >
              <span className="erp-report-card-icon">{CATEGORY_ICONS[report.category]}</span>
              <span className="erp-report-card-title">{report.title}</span>
              <span className="erp-report-card-desc">{report.description}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

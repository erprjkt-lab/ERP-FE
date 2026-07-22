import { Breadcrumb, Divider, Space, Typography } from 'antd'
import type { FC, ReactNode } from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
}

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  children?: ReactNode
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={breadcrumbs.map(b => ({
            title: b.href ? <a href={b.href}>{b.label}</a> : b.label,
          }))}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              {subtitle}
            </Typography.Text>
          )}
        </div>
        {actions && <Space>{actions}</Space>}
      </div>
      {children && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          {children}
        </>
      )}
    </div>
  )
}

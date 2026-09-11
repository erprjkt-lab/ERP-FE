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
    <div style={{ marginBottom: 20 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 6, fontSize: 13 }}
          items={breadcrumbs.map(b => ({
            title: b.href ? <a href={b.href}>{b.label}</a> : b.label,
          }))}
        />
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ flex: '1 1 220px' }}>
          <Typography.Title level={3} style={{ margin: 0, fontSize: 22 }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              {subtitle}
            </Typography.Text>
          )}
        </div>
        {actions && (
          <Space wrap style={{ flex: '0 0 auto' }}>
            {actions}
          </Space>
        )}
      </div>
      {children && (
        <>
          <Divider style={{ margin: '14px 0' }} />
          {children}
        </>
      )}
    </div>
  )
}

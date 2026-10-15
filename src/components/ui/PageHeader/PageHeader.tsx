import { Breadcrumb, Divider, Typography } from 'antd'
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
    <div style={{ marginBottom: 12, width: '100%', maxWidth: '100%' }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          style={{
            marginBottom: 4,
            fontSize: 13,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
          items={breadcrumbs.map(b => ({
            title: b.href ? <a href={b.href}>{b.label}</a> : b.label,
          }))}
        />
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          width: '100%',
        }}
      >
        <div style={{ flex: '1 1 180px', minWidth: 160, maxWidth: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0, fontSize: 20, wordBreak: 'break-word' }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text
              type="secondary"
              style={{ display: 'block', marginTop: 2, fontSize: 13 }}
            >
              {subtitle}
            </Typography.Text>
          )}
        </div>
        {actions && (
          <div
            className="erp-page-header-actions"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 8,
              maxWidth: '100%',
            }}
          >
            {actions}
          </div>
        )}
      </div>
      {children && (
        <>
          <Divider style={{ margin: '10px 0' }} />
          <div style={{ width: '100%', maxWidth: '100%' }}>{children}</div>
        </>
      )}
    </div>
  )
}

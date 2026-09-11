import { Typography, theme as antTheme } from 'antd'
import type { FC, ReactNode } from 'react'
import { BRAND_ACCENT } from '@/theme/brand'
import { SURFACE_MUTED } from '@/theme/neutrals'

export interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

/** Visual grouping only — labels a run of form fields with a tinted heading
 * bar instead of wrapping them in their own card. The bar (rather than a
 * hairline rule) is deliberate: on a long, multi-section form a thin border
 * was easy to scroll past without noticing the section had changed. */
export const FormSection: FC<FormSectionProps> = ({ title, description, children }) => {
  const { token } = antTheme.useToken()

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 14,
          padding: '9px 14px',
          borderRadius: token.borderRadiusSM,
          background: SURFACE_MUTED,
          borderLeft: `3px solid ${BRAND_ACCENT}`,
        }}
      >
        <Typography.Text strong style={{ fontSize: 15, fontWeight: 700 }}>
          {title}
        </Typography.Text>
        {description && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {description}
          </Typography.Text>
        )}
      </div>
      {children}
    </div>
  )
}

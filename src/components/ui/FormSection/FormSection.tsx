import { Typography, theme as antTheme } from 'antd'
import type { FC, ReactNode } from 'react'

export interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

/** Visual grouping only — labels a run of form fields with a heading and a
 * hairline rule instead of wrapping them in their own card. */
export const FormSection: FC<FormSectionProps> = ({ title, description, children }) => {
  const { token } = antTheme.useToken()

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Typography.Text strong style={{ fontSize: 14 }}>
          {title}
        </Typography.Text>
        {description && (
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12, display: 'block', marginTop: 2 }}
          >
            {description}
          </Typography.Text>
        )}
      </div>
      {children}
    </div>
  )
}

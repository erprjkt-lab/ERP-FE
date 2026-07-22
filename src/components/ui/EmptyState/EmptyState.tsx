import { Button, Empty, theme as antTheme } from 'antd'
import type { FC, ReactNode } from 'react'

export interface EmptyStateProps {
  title?: string
  description?: string
  image?: ReactNode | 'simple'
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
}

export const EmptyState: FC<EmptyStateProps> = ({
  title = 'No data',
  description,
  image,
  action,
}) => {
  const { token } = antTheme.useToken()
  const emptyImage = image === 'simple' ? Empty.PRESENTED_IMAGE_SIMPLE : undefined

  return (
    <Empty
      image={emptyImage}
      imageStyle={{ height: 60 }}
      description={
        <span>
          <strong>{title}</strong>
          {description && (
            <>
              <br />
              <span style={{ color: token.colorTextDescription, fontSize: 13 }}>{description}</span>
            </>
          )}
        </span>
      }
      style={{ padding: '40px 0' }}
    >
      {action && (
        <Button type="primary" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Empty>
  )
}

import { Badge, Tag } from 'antd'
import type { FC } from 'react'
import type { Status } from '@/types'

export type StatusBadgeStatus = Status | 'approved' | 'rejected' | 'paid' | 'draft' | 'overdue'

const STATUS_CONFIG: Record<
  StatusBadgeStatus,
  { color: string; label: string; dotStatus?: 'success' | 'processing' | 'error' | 'warning' | 'default' }
> = {
  active: { color: 'green', label: 'Active', dotStatus: 'success' },
  inactive: { color: 'default', label: 'Inactive', dotStatus: 'default' },
  pending: { color: 'orange', label: 'Pending', dotStatus: 'processing' },
  archived: { color: 'default', label: 'Archived', dotStatus: 'default' },
  cancelled: { color: 'red', label: 'Cancelled', dotStatus: 'error' },
  approved: { color: 'green', label: 'Approved', dotStatus: 'success' },
  rejected: { color: 'red', label: 'Rejected', dotStatus: 'error' },
  paid: { color: 'blue', label: 'Paid', dotStatus: 'success' },
  draft: { color: 'default', label: 'Draft', dotStatus: 'default' },
  overdue: { color: 'red', label: 'Overdue', dotStatus: 'error' },
}

export interface StatusBadgeProps {
  status: StatusBadgeStatus
  variant?: 'tag' | 'dot' | 'text'
  label?: string
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, variant = 'tag', label }) => {
  const config = STATUS_CONFIG[status] ?? { color: 'default', label: status, dotStatus: 'default' }
  const displayLabel = label ?? config.label

  if (variant === 'dot') {
    return <Badge status={config.dotStatus} text={displayLabel} />
  }

  if (variant === 'text') {
    return (
      <span style={{ color: variant === 'text' ? undefined : config.color, fontWeight: 500 }}>
        {displayLabel}
      </span>
    )
  }

  return <Tag color={config.color}>{displayLabel}</Tag>
}

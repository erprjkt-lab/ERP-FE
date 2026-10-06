import { Typography } from 'antd'
import type { FC } from 'react'
import { ledgerText } from '@/theme/typography'

export interface SummaryStatProps {
  label: string
  value: number
  tone?: string
}

// Shared between JobCardDetail and RejectionReviewDetail — both show the same
// Ordered/Completed/Rejected/Balance strip at the top of a job card's page.
export const SummaryStat: FC<SummaryStatProps> = ({ label, value, tone }) => (
  <div>
    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
      {label}
    </Typography.Text>
    <span style={{ ...ledgerText, fontSize: 24, fontWeight: 600, color: tone }}>{value}</span>
  </div>
)

export interface MetaItemProps {
  label: string
  value?: string
}

export const MetaItem: FC<MetaItemProps> = ({ label, value }) => (
  <span style={{ fontSize: 13 }}>
    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
      {label}:{' '}
    </Typography.Text>
    <Typography.Text strong style={{ fontSize: 13 }}>
      {value || '—'}
    </Typography.Text>
  </span>
)

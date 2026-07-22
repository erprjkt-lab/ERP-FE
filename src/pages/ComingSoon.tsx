import { Empty, Typography } from 'antd'
import type { FC } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'

export interface ComingSoonProps {
  title: string
}

export const ComingSoon: FC<ComingSoonProps> = ({ title }) => (
  <div>
    <PageHeader title={title} />
    <Empty
      description={<Typography.Text type="secondary">This module is coming soon.</Typography.Text>}
      style={{ padding: '64px 0' }}
    />
  </div>
)

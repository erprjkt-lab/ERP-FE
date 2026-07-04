import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Card, Skeleton, Statistic } from 'antd'
import type { FC, ReactNode } from 'react'

export interface KPICardProps {
  title: string
  value: number | string
  prefix?: ReactNode
  suffix?: string
  trend?: {
    value: number
    label?: string
  }
  loading?: boolean
  formatter?: (value: number | string) => string
  color?: string
}

export const KPICard: FC<KPICardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  loading = false,
  formatter,
  color,
}) => {
  const trendPositive = trend && trend.value >= 0
  const trendColor = trendPositive ? '#52c41a' : '#ff4d4f'

  return (
    <Card
      style={{ height: '100%' }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Skeleton loading={loading} active paragraph={{ rows: 2 }}>
        <Statistic
          title={title}
          value={typeof value === 'number' ? value : value}
          prefix={prefix}
          suffix={suffix}
          formatter={formatter ? (val => formatter(val as number | string)) : undefined}
          valueStyle={{ color: color ?? '#1f1f1f', fontWeight: 600, fontSize: 28 }}
        />
        {trend && (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: trendColor,
              fontSize: 13,
            }}
          >
            {trendPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            <span>
              {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ' vs last month'}
            </span>
          </div>
        )}
      </Skeleton>
    </Card>
  )
}

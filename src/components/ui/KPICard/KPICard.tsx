import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Card, Skeleton, Statistic, theme as antTheme } from 'antd'
import type { FC, ReactNode } from 'react'
import { SIDEBAR_BG } from '@/theme/sidebar'
import { tabularNums } from '@/theme/typography'

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
  tone?: 'default' | 'dark' | 'accent'
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
  tone = 'default',
}) => {
  const { token } = antTheme.useToken()
  const trendPositive = trend && trend.value >= 0
  const trendColor = trendPositive ? token.colorSuccess : token.colorError

  const cardBg = tone === 'dark' ? SIDEBAR_BG : tone === 'accent' ? token.colorPrimary : undefined
  const onTone = tone !== 'default'
  const titleColor = onTone ? 'rgba(255, 255, 255, 0.75)' : token.colorTextDescription
  const valueColor = onTone ? '#fff' : (color ?? token.colorTextHeading)
  const trendTextColor = onTone ? 'rgba(255, 255, 255, 0.85)' : undefined

  return (
    <Card
      style={{ height: '100%', background: cardBg, border: onTone ? 'none' : undefined }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Skeleton loading={loading} active paragraph={{ rows: 2 }}>
        <Statistic
          title={<span style={{ color: titleColor }}>{title}</span>}
          value={typeof value === 'number' ? value : value}
          prefix={prefix}
          suffix={suffix}
          formatter={formatter ? val => formatter(val as number | string) : undefined}
          valueStyle={{ color: valueColor, fontWeight: 600, fontSize: 28, ...tabularNums }}
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
            <span style={{ color: trendTextColor }}>
              {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ' vs last month'}
            </span>
          </div>
        )}
      </Skeleton>
    </Card>
  )
}

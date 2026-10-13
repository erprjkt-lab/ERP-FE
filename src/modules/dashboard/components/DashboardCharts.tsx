import { Tooltip, Typography, theme as antTheme } from 'antd'
import type { FC } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'

/** Validated categorical palette (fixed order — never reassigned by rank/filter). */
export const CATEGORICAL = {
  blue: '#0289C3',
  orange: '#EB6834',
  aqua: '#017678',
  yellow: '#EDA100',
  magenta: '#E87BA4',
}

const STATUS = {
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
}

/** Lower ratio = more severe (e.g. stock qty / reorder level). */
export function severityColor(ratio: number): string {
  if (ratio < 0.34) return STATUS.critical
  if (ratio < 0.67) return STATUS.serious
  return STATUS.warning
}

export interface BarChartDatum {
  label: string
  value: number
}

export interface DonutChartProps {
  data: BarChartDatum[]
  colors?: string[]
  centerLabel?: string
}

/** Part-to-whole ring with a hero total at the center — reads as a complete, intentional
 * shape even when one category dominates (a bar/column form just reads as empty space there). */
export const DonutChart: FC<DonutChartProps> = ({
  data,
  colors = Object.values(CATEGORICAL),
  centerLabel = 'Total',
}) => {
  const { token } = antTheme.useToken()
  const items = data.map((d, i) => ({ ...d, color: colors[i % colors.length] }))
  const total = items.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return <EmptyState title="No data yet" image="simple" />
  }

  const size = 172
  const radius = 68
  const strokeWidth = 24
  const circumference = 2 * Math.PI * radius
  const nonZero = items.filter(d => d.value > 0)
  const gap = nonZero.length > 1 ? 4 : 0

  const arcs = nonZero.reduce<
    Array<(typeof nonZero)[number] & { segLen: number; startAngle: number }>
  >((acc, d) => {
    const cumulativeValue = acc.reduce((sum, a) => sum + a.value, 0)
    const rawLen = (d.value / total) * circumference
    const segLen = Math.max(rawLen - gap, 2)
    const startAngle = (cumulativeValue / total) * 360
    return [...acc, { ...d, segLen, startAngle }]
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={token.colorFillTertiary}
            strokeWidth={strokeWidth}
          />
          {arcs.map(a => (
            <Tooltip key={a.label} title={`${a.label}: ${a.value}`}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={a.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${a.segLen} ${circumference - a.segLen}`}
                transform={`rotate(${a.startAngle - 90} ${size / 2} ${size / 2})`}
                style={{ cursor: 'default' }}
              />
            </Tooltip>
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography.Text strong style={{ fontSize: 30, lineHeight: 1 }}>
            {total}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
            {centerLabel}
          </Typography.Text>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 160 }}>
        {items.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: d.color,
                flexShrink: 0,
              }}
            />
            <Typography.Text style={{ fontSize: 13, flex: 1 }}>{d.label}</Typography.Text>
            <Typography.Text strong style={{ fontSize: 13 }}>
              {d.value}
            </Typography.Text>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface MeterProps {
  value: number
  max: number
  color: string
  height?: number
}

/** A single ratio against a limit — fill carries severity, track is the same hue at low opacity. */
export const Meter: FC<MeterProps> = ({ value, max, color, height = 5 }) => {
  const pct = Math.min(100, Math.max(0, (value / Math.max(max, 1)) * 100))
  return (
    <div style={{ height, borderRadius: height / 2, background: `${color}26`, overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: height / 2,
          transition: 'width 0.3s',
        }}
      />
    </div>
  )
}

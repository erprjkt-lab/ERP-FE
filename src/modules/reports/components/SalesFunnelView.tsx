import { Empty, Typography } from 'antd'
import type { FC } from 'react'
import { getTonalRamp } from '@/theme/color-utils'
import type { ApiSalesFunnelStage } from '@/types/api/reports'

export interface SalesFunnelViewProps {
  stages: ApiSalesFunnelStage[]
}

/** Stage counts as proportional bars, each labelled with its drop-off from the
 * previous stage — the conversion story the report exists to tell. */
export const SalesFunnelView: FC<SalesFunnelViewProps> = ({ stages }) => {
  const max = Math.max(...stages.map(s => s.count), 0)

  if (max === 0) {
    return <Empty description="No sales activity in this period." />
  }

  const ramp = getTonalRamp(stages.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {stages.map((stage, i) => {
        const previous = i > 0 ? stages[i - 1].count : null
        const dropOff =
          previous && previous > 0 ? Math.round(((previous - stage.count) / previous) * 100) : null

        return (
          <div key={stage.stage}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 4,
              }}
            >
              <Typography.Text strong>{stage.stage}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {stage.count}
                {dropOff != null && dropOff > 0 && ` · ${dropOff}% drop-off`}
              </Typography.Text>
            </div>
            <div style={{ height: 22, borderRadius: 6, background: '#F1F5F9', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(stage.count / max) * 100}%`,
                  height: '100%',
                  background: ramp[i],
                  borderRadius: 6,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

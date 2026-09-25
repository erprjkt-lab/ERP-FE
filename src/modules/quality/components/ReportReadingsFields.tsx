import { Col, Form, InputNumber, Row, Typography } from 'antd'
import type { FC } from 'react'
import type { InspectionParameter } from '@/types/production'

export interface ReportReadingsFieldsProps {
  parameters: InspectionParameter[]
}

// One fixed row per inspection parameter already defined for this item/
// process — the operator fills in whichever measured values apply. A row
// left blank is simply not submitted as a reading (see toReadingsPayload).
export const ReportReadingsFields: FC<ReportReadingsFieldsProps> = ({ parameters }) => {
  if (parameters.length === 0) {
    return (
      <Typography.Text type="secondary">
        No inspection parameters are defined for this item/process yet — add them under BOM →
        Inspection Parameters before recording readings.
      </Typography.Text>
    )
  }

  return (
    <div>
      <Row gutter={12} style={{ marginBottom: 8 }}>
        <Col span={8}>
          <Typography.Text strong>Parameter</Typography.Text>
        </Col>
        <Col span={8}>
          <Typography.Text strong>Specification</Typography.Text>
        </Col>
        <Col span={4}>
          <Typography.Text strong>Min / Max</Typography.Text>
        </Col>
        <Col span={4}>
          <Typography.Text strong>Measured Value</Typography.Text>
        </Col>
      </Row>
      {parameters.map(param => (
        <Row key={param.id} gutter={12} align="middle" style={{ marginBottom: 8 }}>
          <Col span={8}>{param.parameter}</Col>
          <Col span={8}>
            <Typography.Text type="secondary">{param.specification}</Typography.Text>
          </Col>
          <Col span={4}>
            <Typography.Text type="secondary">
              {param.min ?? '—'} / {param.max ?? '—'}
            </Typography.Text>
          </Col>
          <Col span={4}>
            <Form.Item name={['readings', param.id]} style={{ marginBottom: 0 }}>
              <InputNumber placeholder="Value" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      ))}
    </div>
  )
}

// The checklist above stores values.readings as {[parameterId]: number |
// undefined} — a fixed-shape object, not a Form.List array — since rows come
// from the defined parameter set rather than being user-added. Blank rows
// are dropped here rather than rejected, since not every sample necessarily
// measures every parameter in one pass.
export function toReadingsPayload(
  readings: Record<string, number | undefined> | undefined,
): { parameter_id: number; measured_value: number }[] {
  return Object.entries(readings ?? {})
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([parameterId, value]) => ({
      parameter_id: Number(parameterId),
      measured_value: value as number,
    }))
}

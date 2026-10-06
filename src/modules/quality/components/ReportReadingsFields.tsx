import { Form, InputNumber } from 'antd'
import type { FormInstance, TableColumnsType } from 'antd'
import type { FC } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { InspectionParameter } from '@/types/production'
import type { InspectionResult } from '@/types/quality'
import { RESULT_BADGE } from '../constants'

export interface ReportReadingsFieldsProps {
  parameters: InspectionParameter[]
  form: FormInstance
}

// Mirrors InspectionReadingService::addReading exactly (fail if outside
// tolerance_min/tolerance_max, else pass) — a live preview only, the
// persisted result is always computed server-side once the reading is saved.
function previewResult(
  value: number | undefined,
  min: number | undefined,
  max: number | undefined,
): InspectionResult | undefined {
  if (value === undefined || value === null) return undefined
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) return 'FAIL'
  return 'PASS'
}

// One fixed row per inspection parameter already defined for this item/
// process — the operator fills in whichever observed values apply. A row
// left blank is simply not submitted as a reading (see toReadingsPayload).
export const ReportReadingsFields: FC<ReportReadingsFieldsProps> = ({ parameters, form }) => {
  const watchedReadings = Form.useWatch('readings', form) as
    Record<string, number | undefined> | undefined

  if (parameters.length === 0) {
    return (
      <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
        No inspection parameters are defined for this item/process yet — add them under BOM →
        Inspection Parameters before recording readings.
      </span>
    )
  }

  const columns: TableColumnsType<InspectionParameter> = [
    {
      title: 'Balloon No',
      key: 'balloonNo',
      width: 90,
      render: (_, __, index) => index + 1,
    },
    { title: 'Parameter', dataIndex: 'parameter', key: 'parameter' },
    { title: 'Specification', dataIndex: 'specification', key: 'specification' },
    { title: 'Min', dataIndex: 'min', key: 'min', width: 90, render: v => v ?? '—' },
    { title: 'Max', dataIndex: 'max', key: 'max', width: 90, render: v => v ?? '—' },
    {
      title: 'Instrument',
      dataIndex: 'instrument',
      key: 'instrument',
      width: 140,
      render: v => v ?? '—',
    },
    {
      title: 'Observed Value',
      key: 'observedValue',
      width: 150,
      render: (_, param) => (
        <Form.Item name={['readings', param.id]} style={{ marginBottom: 0 }}>
          <InputNumber placeholder="Value" style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      title: 'Result',
      key: 'result',
      width: 90,
      render: (_, param) => {
        const result = previewResult(watchedReadings?.[param.id], param.min, param.max)
        return result ? <StatusBadge status={RESULT_BADGE[result]} label={result} /> : '—'
      },
    },
  ]

  return (
    <DataTable<InspectionParameter>
      columns={columns}
      dataSource={parameters}
      rowKey="id"
      pagination={false}
      size="small"
    />
  )
}

// The grid above stores values.readings as {[parameterId]: number |
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

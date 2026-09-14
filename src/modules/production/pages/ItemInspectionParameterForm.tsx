import { Tag } from 'antd'
import type { FC } from 'react'
import { useParams } from 'react-router-dom'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useFinishedGood } from '@/modules/masters/hooks/useFinishedGoods'
import type { InspectionParamType, InspectionParameter } from '@/types/production'
import { MASTER_STATUS_OPTIONS } from '../constants'
import {
  PARAM_TYPE_TO_API,
  useCreateInspectionParameter,
  useDeleteInspectionParameter,
  useInspectionParameters,
  useUpdateInspectionParameter,
} from '../hooks/useInspectionParameters'
import { useProcesses } from '../hooks/useProcesses'

const PARAM_TYPE_OPTIONS: { label: string; value: InspectionParamType }[] = [
  { label: 'Product', value: 'product' },
  { label: 'Process', value: 'process' },
]

const FREQ_UNIT_OPTIONS = [
  { label: 'Hrs', value: 'Hrs' },
  { label: 'Lot', value: 'Lot' },
]

export const ItemInspectionParameterForm: FC = () => {
  const { itemId } = useParams()
  const { data: finishedGood } = useFinishedGood(itemId)
  const { data: parameters = [], isLoading } = useInspectionParameters(itemId)
  const { data: processes = [] } = useProcesses()
  const { mutateAsync: createParameter } = useCreateInspectionParameter(itemId)
  const { mutateAsync: updateParameter } = useUpdateInspectionParameter(itemId)
  const { mutateAsync: deleteParameter } = useDeleteInspectionParameter(itemId)

  const processOptions = processes.map(p => ({ label: p.processName, value: p.id }))

  return (
    <SimpleMasterList<InspectionParameter>
      title={
        finishedGood
          ? `Inspection Parameters — ${finishedGood.code} · ${finishedGood.name}`
          : 'Inspection Parameters'
      }
      breadcrumbParent={{ label: 'BOM', href: '/production/bom' }}
      breadcrumbLabel="Inspection Parameter"
      totalLabel="parameters"
      addButtonLabel="Add Parameter"
      modalWidth={680}
      data={parameters}
      loading={isLoading}
      columns={[
        { title: 'Parameter', dataIndex: 'parameter', key: 'parameter' },
        { title: 'Specification', dataIndex: 'specification', key: 'specification' },
        { title: 'Process', dataIndex: 'processName', key: 'processName', width: 140 },
        {
          title: 'Type',
          dataIndex: 'paramType',
          key: 'paramType',
          width: 90,
          render: (type: InspectionParamType) => (
            <Tag>{type === 'product' ? 'Product' : 'Process'}</Tag>
          ),
        },
        {
          title: 'Min / Max',
          key: 'minMax',
          width: 110,
          render: (_, record) =>
            record.min != null || record.max != null
              ? `${record.min ?? '—'} / ${record.max ?? '—'}`
              : '—',
        },
        {
          title: 'Instrument',
          dataIndex: 'instrument',
          key: 'instrument',
          width: 140,
          render: value => value || '—',
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          render: status => <StatusBadge status={status} />,
        },
      ]}
      renderFields={() => (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <FormField
              label="Process"
              name="processId"
              fieldType="select"
              options={processOptions}
              rules={[{ required: true, message: 'Process is required' }]}
            />
            <FormField
              label="Type"
              name="paramType"
              fieldType="select"
              options={PARAM_TYPE_OPTIONS}
              initialValue="product"
              rules={[{ required: true, message: 'Type is required' }]}
            />
            <FormField
              label="Parameter"
              name="parameter"
              rules={[{ required: true, message: 'Parameter is required' }]}
            />
            <FormField
              label="Specification"
              name="specification"
              rules={[{ required: true, message: 'Specification is required' }]}
            />
            <FormField label="Min" name="min" fieldType="number" />
            <FormField label="Max" name="max" fieldType="number" />
            <FormField label="Machine / Tool" name="machineTool" />
            <FormField label="Instrument" name="instrument" />
            <FormField label="Characteristic Class" name="charClass" />
            <FormField label="Size" name="size" />
            <FormField label="Frequency" name="frequency" fieldType="number" />
            <FormField
              label="Frequency Unit"
              name="freqUnit"
              fieldType="select"
              options={FREQ_UNIT_OPTIONS}
            />
            <FormField label="Control Method" name="controlMethod" />
            <FormField
              label="Status"
              name="status"
              fieldType="select"
              options={MASTER_STATUS_OPTIONS}
              initialValue="active"
            />
          </div>
          <FormField label="Reaction Plan" name="reactionPlan" fieldType="textarea" />
        </>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          process_id: Number(values.processId),
          param_type: PARAM_TYPE_TO_API[values.paramType as InspectionParamType],
          parameter: values.parameter as string,
          specification: values.specification as string,
          min: values.min as number | undefined,
          max: values.max as number | undefined,
          machine_tool: values.machineTool as string | undefined,
          instrument: values.instrument as string | undefined,
          char_class: values.charClass as string | undefined,
          size: values.size as string | undefined,
          frequency: values.frequency as number | undefined,
          freq_unit: values.freqUnit as 'Hrs' | 'Lot' | undefined,
          reaction_plan: values.reactionPlan as string | undefined,
          control_method: values.controlMethod as string | undefined,
          status: values.status === 'inactive' ? 0 : 1,
        }
        if (editing) {
          await updateParameter({ id: editing.id, payload })
        } else {
          await createParameter(payload)
        }
      }}
      onDelete={async record => {
        await deleteParameter(record.id)
      }}
    />
  )
}

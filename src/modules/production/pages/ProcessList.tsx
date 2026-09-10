import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Process } from '@/types/production'
import { MASTER_STATUS_OPTIONS } from '../constants'
import {
  useCreateProcess,
  useDeleteProcess,
  useProcesses,
  useUpdateProcess,
} from '../hooks/useProcesses'

export const ProcessList: FC = () => {
  const { data: processes = [], isLoading } = useProcesses()
  const { mutateAsync: createProcess } = useCreateProcess()
  const { mutateAsync: updateProcess } = useUpdateProcess()
  const { mutateAsync: deleteProcess } = useDeleteProcess()

  return (
    <SimpleMasterList<Process>
      title="Process Master"
      breadcrumbParent={{ label: 'Production' }}
      breadcrumbLabel="Process"
      totalLabel="processes"
      addButtonLabel="Add Process"
      modalWidth={520}
      data={processes}
      loading={isLoading}
      columns={[
        { title: 'Process Name', dataIndex: 'processName', key: 'processName' },
        { title: 'Process Code', dataIndex: 'processCode', key: 'processCode', width: 140 },
        { title: 'Cycle Time (sec)', dataIndex: 'cycleTime', key: 'cycleTime', width: 140 },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          width: 100,
          render: status => <StatusBadge status={status} />,
        },
      ]}
      renderFields={() => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FormField
            label="Process Name"
            name="processName"
            rules={[{ required: true, message: 'Process name is required' }]}
          />
          <FormField label="Process Code" name="processCode" />
          <FormField label="Cycle Time (sec)" name="cycleTime" fieldType="number" />
          <FormField
            label="Status"
            name="status"
            fieldType="select"
            options={MASTER_STATUS_OPTIONS}
            initialValue="active"
          />
        </div>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          process_name: values.processName as string,
          process_code: values.processCode as string | undefined,
          cycle_time: values.cycleTime as number | undefined,
          status: values.status === 'inactive' ? 0 : 1,
        }
        if (editing) {
          await updateProcess({ id: editing.id, payload })
        } else {
          await createProcess(payload)
        }
      }}
      onDelete={async record => {
        await deleteProcess(record.id)
      }}
    />
  )
}

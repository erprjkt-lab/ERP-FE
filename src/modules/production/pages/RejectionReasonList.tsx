import { Tag } from 'antd'
import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { RejectionDecision, RejectionReason } from '@/types/production'
import { MASTER_STATUS_OPTIONS } from '../constants'
import {
  useCreateRejectionReason,
  useDeleteRejectionReason,
  useRejectionReasons,
  useUpdateRejectionReason,
} from '../hooks/useRejections'

const TYPE_OPTIONS: { label: string; value: RejectionDecision }[] = [
  { label: 'Reject', value: 'REJECT' },
  { label: 'Rework', value: 'REWORK' },
]

export const RejectionReasonList: FC = () => {
  const { data: reasons, isLoading } = useRejectionReasons()
  const { mutateAsync: createReason } = useCreateRejectionReason()
  const { mutateAsync: updateReason } = useUpdateRejectionReason()
  const { mutateAsync: deleteReason } = useDeleteRejectionReason()

  return (
    <SimpleMasterList<RejectionReason>
      title="Rejection Reasons"
      subtitle="Reasons reviewers pick when reviewing rejected qty. Rework reasons send parts back for re-processing; Reject reasons scrap them. Only active reasons appear in the review form."
      breadcrumbParent={{ label: 'Rejection Review', href: '/production/rejection-review' }}
      breadcrumbLabel="Rejection Reasons"
      totalLabel="reasons"
      addButtonLabel="Add Reason"
      data={reasons}
      loading={isLoading}
      columns={[
        {
          title: 'Type',
          dataIndex: 'type',
          key: 'type',
          width: 100,
          render: (type: RejectionDecision) => (
            <Tag color={type === 'REWORK' ? 'blue' : 'red'}>
              {type === 'REWORK' ? 'Rework' : 'Reject'}
            </Tag>
          ),
        },
        { title: 'Reason', dataIndex: 'reason', key: 'reason' },
        { title: 'Code', dataIndex: 'code', key: 'code', width: 120, render: v => v || '—' },
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
          <FormField
            label="Type"
            name="type"
            fieldType="select"
            options={TYPE_OPTIONS}
            rules={[{ required: true, message: 'Type is required' }]}
            extra="Rework = part can be fixed and re-processed. Reject = part is scrapped."
          />
          <FormField
            label="Reason"
            name="reason"
            placeholder="e.g. Dimension out of tolerance"
            rules={[{ required: true, message: 'Reason is required' }]}
          />
          <FormField label="Code" name="code" placeholder="e.g. DIM-01 (optional)" />
          <FormField
            label="Status"
            name="status"
            fieldType="select"
            options={MASTER_STATUS_OPTIONS}
            initialValue="active"
          />
        </>
      )}
      onSubmit={async (values, editing) => {
        const payload = {
          type: values.type === 'REWORK' ? 2 : 1,
          reason: values.reason as string,
          code: (values.code as string) || null,
          status: values.status === 'inactive' ? 0 : 1,
        }
        if (editing) {
          await updateReason({ id: editing.id, payload })
        } else {
          await createReason(payload)
        }
      }}
      onDelete={async record => {
        await deleteReason(record.id)
      }}
    />
  )
}

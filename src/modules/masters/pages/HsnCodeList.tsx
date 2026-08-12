import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { HsnCode } from '@/types/masters'
import { MASTER_STATUS_OPTIONS } from '../constants'
import {
  useCreateHsnCode,
  useDeleteHsnCode,
  useHsnCodes,
  useUpdateHsnCode,
} from '../hooks/useHsnCodes'

export const HsnCodeList: FC = () => {
  const { data: hsnCodes = [], isLoading } = useHsnCodes()
  const { mutateAsync: createHsnCode } = useCreateHsnCode()
  const { mutateAsync: updateHsnCode } = useUpdateHsnCode()
  const { mutateAsync: deleteHsnCode } = useDeleteHsnCode()

  return (
    <SimpleMasterList<HsnCode>
      title="HSN Master"
      breadcrumbParent={{ label: 'Hsn & Category & Grade' }}
      breadcrumbLabel="HSN Code"
      totalLabel="HSN codes"
      addButtonLabel="Add HSN Code"
      modalWidth={640}
      data={hsnCodes}
      loading={isLoading}
      columns={[
        { title: 'HSN Code', dataIndex: 'hsn', key: 'hsn', width: 120 },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        { title: 'GST %', dataIndex: 'gstRate', key: 'gstRate', width: 90 },
        { title: 'SGST %', dataIndex: 'sgstRate', key: 'sgstRate', width: 90 },
        { title: 'CGST %', dataIndex: 'cgstRate', key: 'cgstRate', width: 90 },
        { title: 'IGST %', dataIndex: 'igstRate', key: 'igstRate', width: 90 },
        { title: 'Cess %', dataIndex: 'cessRate', key: 'cessRate', width: 90 },
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
            label="HSN Code"
            name="hsn"
            rules={[{ required: true, message: 'HSN code is required' }]}
          />
          <FormField label="Description" name="description" />
          <FormField label="GST Rate (%)" name="gstRate" fieldType="number" />
          <FormField label="SGST Rate (%)" name="sgstRate" fieldType="number" />
          <FormField label="CGST Rate (%)" name="cgstRate" fieldType="number" />
          <FormField label="IGST Rate (%)" name="igstRate" fieldType="number" />
          <FormField label="Cess Rate (%)" name="cessRate" fieldType="number" />
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
          hsn: values.hsn as string,
          description: values.description as string | undefined,
          gst_rate: values.gstRate as number | undefined,
          sgst_rate: values.sgstRate as number | undefined,
          cgst_rate: values.cgstRate as number | undefined,
          igst_rate: values.igstRate as number | undefined,
          cess_rate: values.cessRate as number | undefined,
          status: values.status === 'inactive' ? 0 : 1,
        }
        if (editing) {
          await updateHsnCode({ id: editing.id, payload })
        } else {
          await createHsnCode(payload)
        }
      }}
      onDelete={async record => {
        await deleteHsnCode(record.id)
      }}
    />
  )
}

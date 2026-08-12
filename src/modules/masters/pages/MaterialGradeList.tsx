import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { MaterialGrade } from '@/types/masters'
import { MASTER_STATUS_OPTIONS } from '../constants'
import {
  useCreateMaterialGrade,
  useDeleteMaterialGrade,
  useMaterialGradeList,
  useUpdateMaterialGrade,
} from '../hooks/useMaterialGrades'

export const MaterialGradeList: FC = () => {
  const { data: materialGrades = [], isLoading } = useMaterialGradeList()
  const { mutateAsync: createMaterialGrade } = useCreateMaterialGrade()
  const { mutateAsync: updateMaterialGrade } = useUpdateMaterialGrade()
  const { mutateAsync: deleteMaterialGrade } = useDeleteMaterialGrade()

  return (
    <SimpleMasterList<MaterialGrade>
      title="Material Grade"
      breadcrumbParent={{ label: 'Hsn & Category & Grade' }}
      breadcrumbLabel="Material Grade"
      totalLabel="material grades"
      addButtonLabel="Add Material Grade"
      modalWidth={640}
      data={materialGrades}
      loading={isLoading}
      columns={[
        { title: 'Grade Name', dataIndex: 'materialGrade', key: 'materialGrade' },
        { title: 'Material Type', dataIndex: 'materialType', key: 'materialType' },
        { title: 'Standard', dataIndex: 'standard', key: 'standard' },
        { title: 'Specification', dataIndex: 'specification', key: 'specification' },
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
            label="Grade Name"
            name="materialGrade"
            rules={[{ required: true, message: 'Grade name is required' }]}
          />
          <FormField label="Material Type" name="materialType" />
          <FormField label="Standard" name="standard" />
          <FormField label="Specification" name="specification" />
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
          material_grade: values.materialGrade as string,
          material_type: values.materialType as string | undefined,
          standard: values.standard as string | undefined,
          specification: values.specification as string | undefined,
          status: values.status === 'inactive' ? 0 : 1,
        }
        if (editing) {
          await updateMaterialGrade({ id: editing.id, payload })
        } else {
          await createMaterialGrade(payload)
        }
      }}
      onDelete={async record => {
        await deleteMaterialGrade(record.id)
      }}
    />
  )
}

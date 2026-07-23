import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { Designation } from '@/types/hr'
import { useDepartments } from '../hooks/useDepartments'
import {
  useCreateDesignation,
  useDeleteDesignation,
  useDesignations,
  useUpdateDesignation,
} from '../hooks/useDesignations'

export const DesignationList: FC = () => {
  const { data: designations = [], isLoading } = useDesignations()
  const { data: departments = [] } = useDepartments()
  const { mutateAsync: createDesignation } = useCreateDesignation()
  const { mutateAsync: updateDesignation } = useUpdateDesignation()
  const { mutateAsync: deleteDesignation } = useDeleteDesignation()

  const departmentOptions = departments.map(d => ({ label: d.name, value: d.id }))

  return (
    <SimpleMasterList<Designation>
      title="Designations"
      breadcrumbParent={{ label: 'HR', href: '/hr' }}
      breadcrumbLabel="Designation"
      totalLabel="designations"
      addButtonLabel="Add Designation"
      data={designations}
      loading={isLoading}
      columns={[
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Department', dataIndex: ['department', 'name'], key: 'department' },
      ]}
      getInitialValues={record => ({ title: record.title, departmentId: record.departmentId })}
      renderFields={() => (
        <>
          <FormField
            label="Designation Title"
            name="title"
            rules={[{ required: true, message: 'Title is required' }]}
          />
          <FormField
            label="Department"
            name="departmentId"
            fieldType="select"
            options={departmentOptions}
            rules={[{ required: true, message: 'Department is required' }]}
          />
        </>
      )}
      onSubmit={async (values, editing) => {
        const name = values.title as string
        const departmentId = (values.departmentId as string | undefined) ?? null
        if (editing) {
          await updateDesignation({ id: Number(editing.id), payload: { name }, departmentId })
        } else {
          await createDesignation({ payload: { name }, departmentId })
        }
      }}
      onDelete={async record => {
        await deleteDesignation(Number(record.id))
      }}
    />
  )
}

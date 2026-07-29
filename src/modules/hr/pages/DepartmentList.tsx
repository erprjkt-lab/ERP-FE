import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import type { Department } from '@/types/hr'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from '../hooks/useDepartments'

export const DepartmentList: FC = () => {
  const { data: departments = [], isLoading } = useDepartments()
  const { mutateAsync: createDepartment } = useCreateDepartment()
  const { mutateAsync: updateDepartment } = useUpdateDepartment()
  const { mutateAsync: deleteDepartment } = useDeleteDepartment()

  return (
    <SimpleMasterList<Department>
      title="Departments"
      breadcrumbParent={{ label: 'HR', href: '/hr' }}
      breadcrumbLabel="Department"
      totalLabel="departments"
      addButtonLabel="Add Department"
      data={departments}
      loading={isLoading}
      columns={[{ title: 'Name', dataIndex: 'name', key: 'name' }]}
      renderFields={() => (
        <FormField
          label="Department Name"
          name="name"
          rules={[{ required: true, message: 'Department name is required' }]}
        />
      )}
      onSubmit={async (values, editing) => {
        const name = values.name as string
        if (editing) {
          await updateDepartment({ id: Number(editing.id), payload: { name } })
        } else {
          await createDepartment({ name })
        }
      }}
      onDelete={async record => {
        await deleteDepartment(Number(record.id))
      }}
    />
  )
}

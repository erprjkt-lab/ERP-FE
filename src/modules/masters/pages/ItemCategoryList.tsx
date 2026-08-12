import type { FC } from 'react'
import { SimpleMasterList } from '@/components/erp/SimpleMasterList'
import { FormField } from '@/components/ui/FormField'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { ItemCategory } from '@/types/masters'
import { MASTER_STATUS_OPTIONS } from '../constants'
import {
  useCreateItemCategory,
  useDeleteItemCategory,
  useItemCategoryList,
  useUpdateItemCategory,
} from '../hooks/useItemCategories'

export const ItemCategoryList: FC = () => {
  const { data: categories = [], isLoading } = useItemCategoryList()
  const { mutateAsync: createItemCategory } = useCreateItemCategory()
  const { mutateAsync: updateItemCategory } = useUpdateItemCategory()
  const { mutateAsync: deleteItemCategory } = useDeleteItemCategory()

  const parentOptions = categories.map(c => ({ label: c.name, value: c.id }))

  return (
    <SimpleMasterList<ItemCategory>
      title="Item Category"
      breadcrumbParent={{ label: 'Hsn & Category & Grade' }}
      breadcrumbLabel="Item Category"
      totalLabel="item categories"
      addButtonLabel="Add Item Category"
      modalWidth={640}
      data={categories}
      loading={isLoading}
      columns={[
        { title: 'Category Name', dataIndex: 'name', key: 'name' },
        { title: 'Category Code', dataIndex: 'code', key: 'code', width: 120 },
        { title: 'Parent Category', dataIndex: 'parentName', key: 'parentName' },
        {
          title: 'Is Final',
          dataIndex: 'isFinal',
          key: 'isFinal',
          width: 90,
          render: isFinal => (isFinal ? 'Yes' : 'No'),
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <FormField
            label="Category Name"
            name="name"
            rules={[{ required: true, message: 'Category name is required' }]}
          />
          <FormField label="Category Code" name="code" />
          <FormField
            label="Parent Category"
            name="parentId"
            fieldType="select"
            options={parentOptions}
          />
          <FormField label="Is Final" name="isFinal" fieldType="switch" valuePropName="checked" />
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
          name: values.name as string,
          code: values.code as string | undefined,
          parent_id: values.parentId ? Number(values.parentId) : null,
          is_final: Boolean(values.isFinal),
          status: values.status === 'inactive' ? 0 : 1,
        }
        if (editing) {
          await updateItemCategory({ id: editing.id, payload })
        } else {
          await createItemCategory(payload)
        }
      }}
      onDelete={async record => {
        await deleteItemCategory(record.id)
      }}
    />
  )
}
